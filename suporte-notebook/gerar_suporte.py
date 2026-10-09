#!/usr/bin/env python3
"""
Suporte para notebook com regulagem de altura (impressão 3D).

Gera os arquivos STL de um suporte articulado: cada lado é composto por
uma BASE com cremalheira de entalhes, um BRAÇO (onde o notebook apoia) ligado
à base por uma dobradiça na frente, e uma ESCORA que liga o braço a um dos
entalhes da base. Trocar a escora de entalhe muda a inclinação/altura.

Imprima 2 conjuntos (lado esquerdo e direito são idênticos).

Uso:
    pip install manifold3d numpy
    python3 gerar_suporte.py            # gera STLs em ./stl e imprime a tabela de alturas
    python3 gerar_suporte.py --check    # também verifica colisões em todas as posições

Todas as medidas em milímetros. Ajuste os parâmetros abaixo à vontade.
"""
import math
import os
import struct
import sys

import numpy as np
from manifold3d import CrossSection, Manifold, set_circular_segments

set_circular_segments(96)

# --------------------------------------------------------------------------
# Parâmetros
# --------------------------------------------------------------------------
FURO = 5.4            # furo para parafuso M5 (ou pino impresso de 5 mm)
FOLGA = 0.4           # folga lateral entre peças articuladas

# Base (impressa deitada, face de baixo na mesa)
BASE_COMP = 215       # comprimento (cabe em mesa 220x220)
BASE_ESP = 7          # espessura da régua
ORELHA_E = 7.6        # espessura de cada orelha da dobradiça da base
LARG_UTIL = 24        # largura do braço
TAB_E = 8             # espessura da aba do braço (dobradiça/pivô)
DOBR_X, DOBR_Z = 12, 16   # eixo da dobradiça
R_DOBR = 8            # raio das orelhas/abas

# Cremalheira de entalhes
CREM_TOPO = 13
R_ENTALHE = 5.3
ENTALHE_Z = 12.6
ENTALHES_X = [132 + 12 * i for i in range(7)]   # 132 ... 204

# Braço (impresso de lado)
BRACO_COMP = 215      # do eixo da dobradiça até a ponta traseira
BRACO_Z0, BRACO_Z1 = 9, 19   # faixa vertical da barra (no sistema do braço)
ABA_FRENTE = 10       # quanto a frente do braço avança antes do eixo
BATENTE_ALT = 14      # altura do batente frontal acima da barra
BATENTE_ESP = 6
PIVO_X = 125          # posição do pivô da escora no braço

# Escora (impressa de lado)
ESCORA_COMP = 70      # distância entre pivô e centro do pé
ESCORA_LARG = 10
R_PE = 5.0
ESCORA_Y0 = TAB_E + FOLGA          # escora fica ao lado da aba do pivô
ESCORA_Y1 = LARG_UTIL

# Faixas em Y (largura)
Y_ORELHA_A = (-ORELHA_E - FOLGA, -FOLGA)
Y_ABA = (0, TAB_E)
Y_ORELHA_B = (TAB_E + FOLGA, TAB_E + FOLGA + ORELHA_E)
Y_BASE = (Y_ORELHA_A[0], LARG_UTIL)

AQUI = os.path.dirname(os.path.abspath(__file__))


# --------------------------------------------------------------------------
# Utilidades
# --------------------------------------------------------------------------
def circ(x, z, r):
    return CrossSection.circle(r).translate((x, z))


def ret(x0, z0, x1, z1):
    return CrossSection.square((x1 - x0, z1 - z0)).translate((x0, z0))


def extrudar(perfil, y0, y1):
    """Extruda um perfil 2D (x, z) ao longo de Y, de y0 a y1."""
    return Manifold.extrude(perfil, y1 - y0).rotate((90, 0, 0)).translate((0, y1, 0))


def cil_y(x, z, r, y0, y1):
    return extrudar(circ(x, z, r), y0, y1)


def girar_y(m, ang_graus, cx, cz):
    """Gira no plano XZ (ângulo positivo levanta +X)."""
    return m.translate((-cx, 0, -cz)).rotate((0, -ang_graus, 0)).translate((cx, 0, cz))


def salvar_stl(m, caminho):
    malha = m.to_mesh()
    v = np.asarray(malha.vert_properties)[:, :3]
    t = np.asarray(malha.tri_verts)
    with open(caminho, "wb") as f:
        f.write(b"suporte notebook".ljust(80, b" "))
        f.write(struct.pack("<I", len(t)))
        for a, b, c in t:
            p0, p1, p2 = v[a], v[b], v[c]
            n = np.cross(p1 - p0, p2 - p0)
            n = n / (np.linalg.norm(n) or 1)
            f.write(struct.pack("<12fH", *n, *p0, *p1, *p2, 0))


# --------------------------------------------------------------------------
# Peças (montadas na posição de uso, eixo da dobradiça em DOBR_X, DOBR_Z)
# --------------------------------------------------------------------------
def base():
    regua = extrudar(ret(0, 0, BASE_COMP, BASE_ESP), *Y_BASE)
    crem = extrudar(ret(ENTALHES_X[0] - 9, 0, ENTALHES_X[-1] + 9, CREM_TOPO),
                    *Y_BASE)
    orelha = circ(DOBR_X, DOBR_Z, R_DOBR) + ret(DOBR_X - R_DOBR, 0, DOBR_X + R_DOBR, DOBR_Z)
    corpo = regua + crem + extrudar(orelha, *Y_ORELHA_A) + extrudar(orelha, *Y_ORELHA_B)
    for x in ENTALHES_X:
        corpo -= cil_y(x, ENTALHE_Z, R_ENTALHE, Y_BASE[0] - 1, Y_BASE[1] + 1)
        # canal inclinado na direção da escora: o dente vizinho não encosta nela
        r = angulo_para_entalhe(x)
        if r is not None:
            ang = math.radians(r[2])
            canal = (CrossSection.square((2 * R_ENTALHE, 30))
                     .translate((-R_ENTALHE, 0)).rotate(math.degrees(-ang))
                     .translate((x, ENTALHE_Z)))
            corpo -= extrudar(canal, Y_BASE[0] - 1, Y_BASE[1] + 1)
    corpo -= cil_y(DOBR_X, DOBR_Z, FURO / 2, Y_BASE[0] - 1, Y_BASE[1] + 1)
    return corpo


def braco():
    """Braço na posição horizontal (ângulo 0)."""
    ox, oz = DOBR_X, DOBR_Z
    barra = ret(ox - ABA_FRENTE, oz + BRACO_Z0, ox + BRACO_COMP, oz + BRACO_Z1)
    batente = ret(ox - ABA_FRENTE, oz + BRACO_Z0, ox - ABA_FRENTE + BATENTE_ESP,
                  oz + BRACO_Z1 + BATENTE_ALT)
    perfil_largo = barra + batente
    aba = (circ(ox, oz, R_DOBR) + ret(ox - R_DOBR, oz, ox + R_DOBR, oz + BRACO_Z0 + 1)
           + circ(ox + PIVO_X, oz, R_DOBR)
           + ret(ox + PIVO_X - R_DOBR, oz, ox + PIVO_X + R_DOBR, oz + BRACO_Z0 + 1))
    corpo = extrudar(perfil_largo, 0, LARG_UTIL) + extrudar(aba, *Y_ABA)
    corpo -= cil_y(ox, oz, FURO / 2, -1, LARG_UTIL + 1)
    corpo -= cil_y(ox + PIVO_X, oz, FURO / 2, -1, LARG_UTIL + 1)
    return corpo


def escora_local():
    """Escora com o pivô em (0,0) e o pé em (0,-ESCORA_COMP)."""
    perfil = (circ(0, 0, R_DOBR)
              + ret(-ESCORA_LARG / 2, -ESCORA_COMP, ESCORA_LARG / 2, 0)
              + circ(0, -ESCORA_COMP, R_PE))
    corpo = extrudar(perfil, ESCORA_Y0, ESCORA_Y1)
    corpo -= cil_y(0, 0, FURO / 2, ESCORA_Y0 - 1, ESCORA_Y1 + 1)
    return corpo


def pino(comp):
    """Pino impresso (alternativa ao parafuso M5), impresso deitado.

    A base é achatada 0,5 mm para aderir à mesa; deitado, o pino resiste
    muito melhor ao cisalhamento do que impresso em pé.
    """
    cabeca = Manifold.cylinder(3, 5)
    haste = Manifold.cylinder(3 + comp + 4, 2.45)
    p = (cabeca + haste).rotate((0, 90, 0))
    return p.trim_by_plane((0, 0, 1), -2.45 + 0.5)


def trava_pino():
    """Anel de trava que entra sob pressão na ponta do pino impresso."""
    return Manifold.cylinder(4, 5) - Manifold.cylinder(10, 2.3).translate((0, 0, -1))


# --------------------------------------------------------------------------
# Cinemática: ângulo do braço para cada entalhe
# --------------------------------------------------------------------------
def angulo_para_entalhe(xe):
    pe_z = ENTALHE_Z - (R_ENTALHE - R_PE)
    def dist(th):
        qx = DOBR_X + PIVO_X * math.cos(th)
        qz = DOBR_Z + PIVO_X * math.sin(th)
        return math.hypot(qx - xe, qz - pe_z) - ESCORA_COMP
    lo, hi = 0.0, math.radians(80)
    if dist(lo) > 0 or dist(hi) < 0:
        return None
    for _ in range(60):
        mid = (lo + hi) / 2
        if dist(mid) < 0:
            lo = mid
        else:
            hi = mid
    th = (lo + hi) / 2
    qx = DOBR_X + PIVO_X * math.cos(th)
    qz = DOBR_Z + PIVO_X * math.sin(th)
    # ângulo da escora (0 = vertical, positivo = pé à frente do pivô)
    ang_escora = math.degrees(math.atan2(qx - xe, qz - pe_z))
    return math.degrees(th), (qx, qz), ang_escora


def altura_traseira(th_graus):
    th = math.radians(th_graus)
    return DOBR_Z + BRACO_COMP * math.sin(th) + BRACO_Z1 * math.cos(th)


def montagem(xe):
    r = angulo_para_entalhe(xe)
    th, (qx, qz), ang_esc = r
    b = girar_y(braco(), th, DOBR_X, DOBR_Z)
    e = escora_local().rotate((0, ang_esc, 0)).translate((qx, 0, qz))
    return b, e, th


def main():
    os.makedirs(os.path.join(AQUI, "stl"), exist_ok=True)

    print("Entalhe | x (mm) | inclinação | altura traseira do braço")
    validos = []
    for i, x in enumerate(ENTALHES_X, 1):
        r = angulo_para_entalhe(x)
        if r is None:
            print(f"  {i:>2}    | {x:>5}  |   (fora de alcance)")
            continue
        validos.append(x)
        print(f"  {i:>2}    | {x:>5}  |   {r[0]:5.1f}°   | {altura_traseira(r[0]):6.1f} mm")

    if "--check" in sys.argv:
        bs = base()
        for x in validos:
            b, e, th = montagem(x)
            # remove os furos (pinos) do teste: só interessa colisão de corpo
            v1 = (bs ^ b).volume()
            v2 = (b ^ e).volume()
            v3 = (bs ^ e).volume()
            print(f"colisão @x={x}: base×braço={v1:.2f} braço×escora={v2:.2f} "
                  f"base×escora={v3:.2f} mm³")

    # Peças na orientação de impressão
    pecas = {
        # base: já está com a face de baixo em z=0
        "base.stl": base(),
        # braço: deitado de lado (face y=0, a das abas, na mesa) -> furos verticais, sem balanço
        "braco.stl": braco().rotate((90, 0, 0)),
        "escora.stl": escora_local().rotate((-90, 0, 0)),
        "pino_dobradica.stl": pino(Y_ORELHA_B[1] - Y_ORELHA_A[0]),
        "pino_escora.stl": pino(ESCORA_Y1),
        "trava_pino.stl": trava_pino(),
    }
    for nome, m in pecas.items():
        bb = m.bounding_box()
        m = m.translate((-bb[0], -bb[1], -bb[2]))
        salvar_stl(m, os.path.join(AQUI, "stl", nome))
        bb = m.bounding_box()
        print(f"{nome:22s} {bb[3]:6.1f} x {bb[4]:6.1f} x {bb[5]:6.1f} mm  "
              f"vol={m.volume() / 1000:5.1f} cm³  genus={m.genus()}")

    # Montagens (apenas para visualização)
    if validos:
        for nome, x in (("montagem_baixa.stl", validos[-1]), ("montagem_alta.stl", validos[0])):
            b, e, _ = montagem(x)
            salvar_stl(base() + b + e, os.path.join(AQUI, "stl", nome))


if __name__ == "__main__":
    main()
