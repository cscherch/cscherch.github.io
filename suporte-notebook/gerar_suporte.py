#!/usr/bin/env python3
"""
Suporte para notebook com regulagem de altura (impressão 3D).

Dois módulos idênticos (esquerdo e direito), ligados por duas travessas.
Cada módulo tem uma BASE com cremalheira de 7 entalhes, um BRAÇO (onde o
notebook apoia) articulado na frente da base e uma ESCORA que liga o braço a
um dos entalhes. Trocar a escora de entalhe muda a inclinação (6° a 31°).

As TRAVESSAS (frente e trás) entram por rabo-de-andorinha embaixo das bases;
cada uma tem duas metades (haste + luva) travadas por um pino, o que permite
ajustar o vão entre os módulos de 180 a 280 mm.

Uso:
    pip install manifold3d numpy
    python3 gerar_suporte.py            # gera os STLs em ./stl e a tabela de posições
    python3 gerar_suporte.py --check    # também verifica colisões e balanços de impressão

Medidas em milímetros.
"""
import math
import os
import struct
import sys

import numpy as np
from manifold3d import CrossSection, JoinType, Manifold, OpType, set_circular_segments

set_circular_segments(72)
REDONDO = JoinType.Round

# --------------------------------------------------------------------------
# Parâmetros
# --------------------------------------------------------------------------
FURO = 5.4                 # furo para parafuso M5
FOLGA = 0.4                # folga entre peças articuladas
CABECA = (9.5, 3.2)        # rebaixo para cabeça de parafuso Allen M5 (Ø, profundidade)
PORCA = (8.4, 4.2)         # alojamento sextavado para porca M5 (entre faces, profundidade)

# Base
BASE_COMP = 215
ORELHA_E = 7.6
LARG_UTIL = 24             # largura do braço
TAB_E = 8                  # espessura das abas do braço
DOBR_X, DOBR_Z = 12, 16    # eixo da dobradiça
R_DOBR = 8
PE_SILICONE = (10.4, 1.0)  # rebaixo dos pés (Ø, profundidade)

# Cremalheira
R_ENTALHE, ENTALHE_Z = 5.3, 12.6
ENTALHES_X = [132 + 12 * i for i in range(7)]

# Braço
BRACO_COMP = 215
PIVO_X = 125
CANAL_SILICONE = (12, 1.0)  # canal no topo do braço (largura, profundidade)

# Escora
ESCORA_COMP = 70
R_PE = 5.0

# Travessas
TRAV_X = (42, 112)          # posição das travessas ao longo da base
RABO = (16, 22, 4.5)        # rabo-de-andorinha: largura embaixo, em cima, altura
FOLGA_RABO = 0.35
HASTE_COMP = 200            # metade A
LUVA_COMP = 190             # metade B
PASSO_VAO = 10
VAOS = list(range(180, 281, PASSO_VAO))   # vão entre as bases (face interna a face interna)

Y_ORELHA_A = (-ORELHA_E - FOLGA, -FOLGA)
Y_ABA = (0, TAB_E)
Y_ORELHA_B = (TAB_E + FOLGA, TAB_E + FOLGA + ORELHA_E)
Y_BASE = (Y_ORELHA_A[0], LARG_UTIL)
LARG_BASE = Y_BASE[1] - Y_BASE[0]
ESCORA_Y = (TAB_E + FOLGA, LARG_UTIL)

AQUI = os.path.dirname(os.path.abspath(__file__))


# --------------------------------------------------------------------------
# Utilidades
# --------------------------------------------------------------------------
def poligono(pts):
    return CrossSection([pts])


def circ(x, z, r):
    return CrossSection.circle(r).translate((x, z))


def ret(x0, z0, x1, z1):
    return CrossSection.square((x1 - x0, z1 - z0)).translate((x0, z0))


def arredondar(cs, r):
    """Arredonda os cantos convexos de um perfil 2D."""
    return cs.offset(-r, REDONDO).offset(r, REDONDO)


def concordar(cs, r):
    """Arredonda os cantos côncavos de um perfil 2D."""
    return cs.offset(r, REDONDO).offset(-r, REDONDO)


def extrudar(perfil, y0, y1):
    """Extruda um perfil 2D (x, z) ao longo de Y, de y0 a y1."""
    return Manifold.extrude(perfil, y1 - y0).rotate((90, 0, 0)).translate((0, y1, 0))


def extrudar_arred(perfil, y0, y1, r=1.6, passos=12, lados=(True, True)):
    """Extrusão com as arestas das faces y0/y1 arredondadas (raio r)."""
    fatias = []
    for k in range(passos + 1):
        t = (math.pi / 2) * k / passos
        dy, dp = r * (1 - math.cos(t)), r * (1 - math.sin(t))
        p = perfil.offset(-dp, REDONDO) if dp > 1e-6 else perfil
        if p.is_empty():
            continue
        fatias.append(extrudar(p, y0 + (dy if lados[0] else 0), y1 - (dy if lados[1] else 0)))
    return Manifold.batch_boolean(fatias, OpType.Add)


def cil_y(x, z, r, y0, y1):
    return extrudar(circ(x, z, r), y0, y1)


def sextavado_y(x, z, entre_faces, y0, y1):
    r = entre_faces / math.sqrt(3)
    # vértice para cima: o teto do alojamento se sustenta sozinho na impressão
    pts = [(x + r * math.cos(math.radians(30 + 60 * i)), z + r * math.sin(math.radians(30 + 60 * i)))
           for i in range(6)]
    return extrudar(poligono(pts), y0, y1)


def caixa(x0, y0, z0, x1, y1, z1):
    return Manifold.cube((x1 - x0, y1 - y0, z1 - z0)).translate((x0, y0, z0))


def somar(pecas):
    return Manifold.batch_boolean(list(pecas), OpType.Add)


def girar_y(m, ang_graus, cx, cz):
    """Gira no plano XZ em torno de (cx, cz); ângulo positivo levanta +X."""
    return m.translate((-cx, 0, -cz)).rotate((0, -ang_graus, 0)).translate((cx, 0, cz))


def salvar_stl(m, caminho):
    malha = m.to_mesh()
    v = np.asarray(malha.vert_properties)[:, :3]
    tri = v[np.asarray(malha.tri_verts)]
    n = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
    n /= np.linalg.norm(n, axis=1)[:, None] + 1e-12
    dados = np.zeros(len(tri), dtype=[("n", "<f4", 3), ("v", "<f4", (3, 3)), ("a", "<u2")])
    dados["n"], dados["v"] = n, tri
    with open(caminho, "wb") as f:
        f.write(b"suporte notebook".ljust(80, b" "))
        f.write(struct.pack("<I", len(tri)))
        f.write(dados.tobytes())


# --------------------------------------------------------------------------
# Cinemática: ângulo do braço para cada entalhe
# --------------------------------------------------------------------------
def angulo_para_entalhe(xe):
    """Retorna (ângulo do braço, posição do pivô da escora, ângulo da escora)."""
    pe_z = ENTALHE_Z - (R_ENTALHE - R_PE)

    def dist(th):
        return math.hypot(DOBR_X + PIVO_X * math.cos(th) - xe,
                          DOBR_Z + PIVO_X * math.sin(th) - pe_z) - ESCORA_COMP

    lo, hi = 0.0, math.radians(80)
    for _ in range(60):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if dist(mid) < 0 else (lo, mid)
    qx, qz = DOBR_X + PIVO_X * math.cos(lo), DOBR_Z + PIVO_X * math.sin(lo)
    return math.degrees(lo), (qx, qz), math.degrees(math.atan2(qx - xe, qz - pe_z))


def altura_traseira(th_graus):
    th = math.radians(th_graus)
    return DOBR_Z + BRACO_COMP * math.sin(th) + 19 * math.cos(th)


# --------------------------------------------------------------------------
# Peças (na posição de montagem)
# --------------------------------------------------------------------------
def perfil_escora(folga=0.0):
    return CrossSection.hull(circ(0, 0, R_DOBR + folga) + circ(0, -ESCORA_COMP, R_PE + folga))


def escora_local():
    """Escora com o pivô em (0, 0) e o pé em (0, -ESCORA_COMP)."""
    corpo = extrudar_arred(perfil_escora(), *ESCORA_Y, r=1.5)
    corpo -= cil_y(0, 0, FURO / 2, ESCORA_Y[0] - 1, ESCORA_Y[1] + 1)
    corpo -= sextavado_y(0, 0, PORCA[0], ESCORA_Y[1] - PORCA[1], ESCORA_Y[1] + 1)
    return corpo


def perfil_rabo(xc, folga=0.0):
    w0, w1, h = RABO[0] + folga, RABO[1] + folga, RABO[2] + folga / 2
    z0 = -1 if folga else 0
    return poligono([(xc - w0 / 2, z0), (xc + w0 / 2, z0), (xc + w1 / 2, h), (xc - w1 / 2, h)])


def base():
    topo = [(0, 0), (BASE_COMP, 0), (BASE_COMP, 13), (122, 13), (108, 10), (36, 10),
            (24, 6.5), (0, 6.5)]
    p = concordar(arredondar(poligono(topo), 3), 8)
    p = arredondar(p - poligono([(-1, 3.5), (3, 7), (-1, 7)]), 2)   # nariz chanfrado
    entalhes = [circ(x, ENTALHE_Z, R_ENTALHE) for x in ENTALHES_X]
    p = arredondar(p - CrossSection.batch_boolean(entalhes, OpType.Add), 0.5)
    corpo = extrudar_arred(p, *Y_BASE, r=2.0)

    orelha = arredondar(circ(DOBR_X, DOBR_Z, R_DOBR)
                        + ret(DOBR_X - R_DOBR, 0, DOBR_X + R_DOBR, DOBR_Z), 1.5)
    corpo += extrudar_arred(orelha, *Y_ORELHA_A, r=1.2) + extrudar_arred(orelha, *Y_ORELHA_B, r=1.2)
    corpo -= cil_y(DOBR_X, DOBR_Z, FURO / 2, Y_BASE[0] - 1, Y_BASE[1] + 1)
    corpo -= cil_y(DOBR_X, DOBR_Z, CABECA[0] / 2, Y_ORELHA_A[0] - 1, Y_ORELHA_A[0] + CABECA[1])
    corpo -= sextavado_y(DOBR_X, DOBR_Z, PORCA[0], Y_ORELHA_B[1] - PORCA[1], Y_ORELHA_B[1] + 1)

    # folga exata para a escora em cada entalhe: o dente vizinho nunca encosta nela
    for x in ENTALHES_X:
        _, (qx, qz), ang = angulo_para_entalhe(x)
        folga = extrudar(perfil_escora(0.4), Y_BASE[0] - 1, Y_BASE[1] + 1)
        corpo -= folga.rotate((0, ang, 0)).translate((qx, 0, qz))

    for xc in TRAV_X:
        corpo -= extrudar(perfil_rabo(xc, FOLGA_RABO), Y_BASE[0] - 1, Y_BASE[1] + 1)
    for x, y in pes_xy():
        corpo -= Manifold.cylinder(PE_SILICONE[1], PE_SILICONE[0] / 2).translate((x, y, -0.01))
    return corpo


def pes_xy():
    return [(x, y) for x in (8, BASE_COMP - 10) for y in (Y_BASE[0] + 7, Y_BASE[1] - 7)]


def braco():
    """Braço na posição horizontal (ângulo 0)."""
    ox, oz = DOBR_X, DOBR_Z
    pts = [(-10, 9), (135, 9), (BRACO_COMP, 13), (BRACO_COMP, 19), (-4, 19), (-4, 31), (-10, 31)]
    lamina = concordar(arredondar(poligono([(ox + x, oz + z) for x, z in pts]), 2.5), 3)
    corpo = extrudar_arred(lamina, 0, LARG_UTIL, r=2.0)
    w, d = CANAL_SILICONE
    y0 = (LARG_UTIL - w) / 2
    corpo -= caixa(ox + 6, y0, oz + 19 - d, ox + BRACO_COMP - 8, y0 + w, oz + 30)

    abas = arredondar(circ(ox, oz, R_DOBR) + ret(ox - R_DOBR, oz, ox + R_DOBR, oz + 10), 1.2)
    abas += arredondar(circ(ox + PIVO_X, oz, R_DOBR)
                       + ret(ox + PIVO_X - R_DOBR, oz, ox + PIVO_X + R_DOBR, oz + 10), 1.2)
    corpo += extrudar_arred(abas, *Y_ABA, r=1.2, lados=(True, False))
    corpo -= cil_y(ox, oz, FURO / 2, -1, LARG_UTIL + 1)
    corpo -= cil_y(ox + PIVO_X, oz, FURO / 2, -1, LARG_UTIL + 1)
    corpo -= cil_y(ox + PIVO_X, oz, CABECA[0] / 2, -1, CABECA[1])
    return corpo


def tira_silicone():
    """Tira para o canal do braço (TPU ou silicone adesivo), na posição de montagem."""
    ox, oz = DOBR_X, DOBR_Z
    w, d = CANAL_SILICONE
    y0 = (LARG_UTIL - w) / 2
    return caixa(ox + 6.3, y0 + 0.3, oz + 19 - d, ox + BRACO_COMP - 8.3, y0 + w - 0.3, oz + 19.8)


def pe_silicone():
    return Manifold.cylinder(2.5, PE_SILICONE[0] / 2 - 0.2)


def travessa_a():
    """Metade A (haste com furos). Rabo-de-andorinha em y = 0..LARG_BASE, x centrado em 0."""
    rabo = arredondar(perfil_rabo(0), 0.8)
    haste = arredondar(ret(-8, 0, 8, 5), 1.6)
    a = extrudar_arred(rabo, 0, LARG_BASE + 0.8, r=1.0, lados=(True, False))
    a += extrudar_arred(haste, LARG_BASE + 0.3, HASTE_COMP, r=1.2)
    for y in furos_haste():
        a -= Manifold.cylinder(20, 2.7).translate((0, y, -5))
    return a


def furos_haste():
    return [HASTE_COMP - 8 - PASSO_VAO * k for k in range(14)]


def furo_luva():
    """Distância do furo da luva até a sua entrada (faz os vãos caírem em múltiplos de 10 mm)."""
    return 18.0


def travessa_b():
    """Metade B (luva). Rabo-de-andorinha em y = 0..LARG_BASE, luva até LUVA_COMP."""
    rabo = arredondar(perfil_rabo(0), 0.8)
    luva = arredondar(ret(-12, 0, 12, 9.5), 3)
    b = extrudar_arred(rabo, 0, LARG_BASE + 0.8, r=1.0, lados=(True, False))
    b += extrudar_arred(luva, LARG_BASE + 0.3, LUVA_COMP, r=2.5)
    b -= extrudar(arredondar(ret(-8.35, -1, 8.35, 5.45), 1.2), LARG_BASE, LUVA_COMP + 1)
    b -= Manifold.cylinder(30, 2.7).translate((0, LUVA_COMP - furo_luva(), -5))
    return b


def pino_travessa():
    """Pino da luva, impresso deitado (achatado 0,5 mm para aderir à mesa)."""
    cabeca = Manifold.cylinder(1.8, 5.5)
    haste = Manifold.cylinder(1.8 + 9.3, 2.45)
    return (cabeca + haste).rotate((0, 90, 0)).trim_by_plane((0, 0, 1), -2.45 + 0.5)


# --------------------------------------------------------------------------
# Montagem
# --------------------------------------------------------------------------
def montagem_modulo(xe):
    th, (qx, qz), ang = angulo_para_entalhe(xe)
    b = girar_y(braco(), th, DOBR_X, DOBR_Z)
    s = girar_y(tira_silicone(), th, DOBR_X, DOBR_Z)
    e = escora_local().rotate((0, ang, 0)).translate((qx, 0, qz))
    return b, s, e, th


def deslocamento_direita(vao):
    return LARG_BASE + vao


def montagem_travessas(vao):
    """Travessas A, B e pinos montados para o vão dado (módulo esquerdo em y=Y_BASE)."""
    y_fim = Y_BASE[1] + deslocamento_direita(vao)
    a, b, p = [], [], []
    y_furo = y_fim - (LUVA_COMP - furo_luva())
    for xc in TRAV_X:
        a.append(travessa_a().translate((xc, Y_BASE[0], 0)))
        b.append(travessa_b().rotate((0, 0, 180)).translate((xc, y_fim, 0)))
        p.append(Manifold.cylinder(9.3, 2.45).translate((xc, y_furo, 0.2))
                 + Manifold.cylinder(1.8, 5.5).translate((xc, y_furo, 9.5)))
    return somar(a), somar(b), somar(p), y_furo


def vao_valido(vao):
    """O furo da luva precisa coincidir com um furo da haste."""
    y_fim = Y_BASE[1] + deslocamento_direita(vao)
    y_furo = y_fim - (LUVA_COMP - furo_luva())
    return any(abs(Y_BASE[0] + f - y_furo) < 0.01 for f in furos_haste())


# --------------------------------------------------------------------------
# Verificações
# --------------------------------------------------------------------------
def balanco_impressao(m, passo=0.4, inclinacao_max=50, ignorar_base=2.5, ponte_max=25):
    """Maior área (mm²) de camada em balanço, acima de `inclinacao_max` graus da vertical.

    Não contam como balanço: pontes (região apoiada em dois lados opostos, com vão até
    `ponte_max` mm, como o teto de furos e canais) e saliências finas (até 2,5 mm).
    """
    bb = m.bounding_box()
    m = m.translate((0, 0, -bb[2]))
    altura = bb[5] - bb[2]
    tolerancia = passo * math.tan(math.radians(inclinacao_max))
    pior, z = 0.0, ignorar_base
    anterior = m.slice(z)
    while z + passo < altura - 0.1:
        atual = m.slice(z + passo)
        apoio = anterior.offset(tolerancia, REDONDO)
        for parte in (atual - apoio).decompose():
            if parte.offset(-1.25, REDONDO).is_empty():
                continue                                   # saliência fina
            contato = (parte.offset(1.0, REDONDO) ^ apoio).decompose()
            x0, y0, x1, y1 = parte.bounds()
            if len(contato) >= 2 and min(x1 - x0, y1 - y0) <= ponte_max:
                continue                                   # ponte
            pior = max(pior, parte.area())
        anterior, z = atual, z + passo
    return pior


def verificar():
    ok = True
    bs = base()
    print("\nColisões (mm³) por entalhe:")
    for x in ENTALHES_X:
        b, s, e, th = montagem_modulo(x)
        v = [(bs ^ b).volume(), (b ^ e).volume(), (bs ^ e).volume(), (b ^ s).volume()]
        ok &= max(v) < 0.05
        print(f"  x={x}: base×braço={v[0]:.2f} braço×escora={v[1]:.2f} "
              f"base×escora={v[2]:.2f} braço×silicone={v[3]:.2f}")
    print("Colisões (mm³) das travessas por vão:")
    for vao in VAOS:
        a, b, p, _ = montagem_travessas(vao)
        bd = bs.translate((0, deslocamento_direita(vao), 0))
        v = [(bs ^ a).volume(), (bd ^ b).volume(), (a ^ b).volume(), (a ^ p).volume(), (b ^ p).volume()]
        ok &= max(v) < 0.05 and vao_valido(vao)
        print(f"  vão {vao}: baseE×A={v[0]:.2f} baseD×B={v[1]:.2f} A×B={v[2]:.2f} "
              f"pino={max(v[3:]):.2f} furos alinhados={'sim' if vao_valido(vao) else 'NÃO'}")
    print("Balanço de impressão (mm² sem apoio além de 50°):")
    for nome, m in pecas_impressao().items():
        if nome.startswith("pino") or nome.startswith("pe_") or nome.startswith("tira"):
            continue
        area = balanco_impressao(m)
        ok &= area < 5
        print(f"  {nome:20s} {area:6.2f}")
    print("RESULTADO:", "OK" if ok else "PROBLEMAS ENCONTRADOS")
    return ok


# --------------------------------------------------------------------------
# Saída
# --------------------------------------------------------------------------
def pecas_impressao():
    return {
        "base.stl": base(),                                   # deitada, como está
        "braco.stl": braco().rotate((90, 0, 0)),              # de lado, abas na mesa
        "escora.stl": escora_local().rotate((90, 0, 0)),      # de lado
        "travessa_haste.stl": travessa_a(),                   # como está
        "travessa_luva.stl": travessa_b(),                    # como está (luva aberta embaixo)
        "pino_travessa.stl": pino_travessa(),                 # deitado
        "tira_silicone_TPU.stl": tira_silicone(),             # opcional, TPU
        "pe_silicone_TPU.stl": pe_silicone(),                 # opcional, TPU
    }


def main():
    os.makedirs(os.path.join(AQUI, "stl"), exist_ok=True)
    print("Entalhe | inclinação | altura da ponta traseira do braço")
    for i, x in enumerate(ENTALHES_X, 1):
        th = angulo_para_entalhe(x)[0]
        print(f"   {i}    |   {th:5.1f}°   | {altura_traseira(th):6.1f} mm")
    print("Vãos possíveis entre as bases:", ", ".join(str(v) for v in VAOS if vao_valido(v)), "mm")

    for nome, m in pecas_impressao().items():
        bb = m.bounding_box()
        m = m.translate((-bb[0], -bb[1], -bb[2]))
        salvar_stl(m, os.path.join(AQUI, "stl", nome))
        bb = m.bounding_box()
        print(f"{nome:24s} {bb[3]:6.1f} x {bb[4]:6.1f} x {bb[5]:6.1f} mm  vol={m.volume() / 1000:5.1f} cm³")

    # montagem completa (só para visualizar; não imprimir)
    b, s, e, _ = montagem_modulo(ENTALHES_X[3])
    modulo = somar([base(), b, s, e])
    a, tb, p, _ = montagem_travessas(220)
    salvar_stl(somar([modulo, modulo.translate((0, deslocamento_direita(220), 0)), a, tb, p]),
               os.path.join(AQUI, "stl", "montagem_visualizar.stl"))

    if "--check" in sys.argv and not verificar():
        sys.exit(1)


if __name__ == "__main__":
    main()
