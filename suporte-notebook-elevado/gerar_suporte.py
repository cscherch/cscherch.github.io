#!/usr/bin/env python3
"""
Suporte para notebook ELEVADO com regulagem de altura (impressão 3D).

Eleva o notebook inteiro (frente e traseira). Cada módulo (esquerdo e direito,
idênticos) tem:
  - BASE com duas torres (frente e trás), cada uma com dois furos de trava;
  - duas COLUNAS que deslizam dentro das torres, com furos a cada 10 mm;
  - um TRILHO onde o notebook apoia, articulado no topo das colunas
    (furo redondo na frente, rasgo atrás para permitir inclinação).

Os furos da torre ficam 15 mm um do outro e os da coluna 10 mm: combinando
furo da torre + furo da coluna, a altura varia em passos de 5 mm.
Frente e traseira são independentes: alturas iguais = plano; traseira mais
alta = inclinado.

Uso:
    pip install manifold3d numpy
    python3 gerar_suporte.py            # gera STLs em ./stl e a tabela de alturas
    python3 gerar_suporte.py --check    # também verifica colisões em todas as combinações

Medidas em milímetros.
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
FURO = 5.4             # furo para parafuso M5 (ou pino impresso Ø4,9)
FOLGA = 0.4            # folga entre peças

# Base
BASE_COMP = 190
BASE_LARG = 60         # largura do pé (estabilidade lateral)
BASE_ESP = 8
TORRES_X = (20, 170)   # centro das torres (frente, trás)
TORRE_ALT = 85         # altura total da torre (a partir da mesa)
TORRE_PAREDE = 4.6
FUROS_TORRE_Z = (77, 62)   # furos de trava na torre (15 mm de distância)
NERVURA_ALT = 35       # nervuras de reforço da torre

# Coluna (seção quadrada)
COL_LADO = 20
COL_COMP = 80
FUROS_COL = [12 + 10 * i for i in range(6)]   # a partir da base da coluna
INSERCAO_MIN = 30      # quanto a coluna precisa ficar dentro da torre
PINO_ACIMA = 13        # eixo da articulação acima do topo da coluna
R_ABA = 8
ABA_E = 8              # espessura da aba no topo da coluna (y 0..ABA_E)

# Trilho
TRILHO_LARG = 24       # y 0..24
TRILHO_Z0, TRILHO_Z1 = 9, 19    # faixa da barra acima do eixo
FRENTE_EXTRA = 15      # trilho avança à frente do pino dianteiro
TRAS_EXTRA = 22        # e passa atrás do pino traseiro
BATENTE_ALT = 14
BATENTE_ESP = 6
RASGO = 12             # comprimento do rasgo traseiro (permite inclinar)
DIF_MAX = 55           # diferença máxima de altura entre frente e trás

DIST = TORRES_X[1] - TORRES_X[0]
Y_COL = (0, COL_LADO)
Y_BOCHECHA = (ABA_E + FOLGA, TRILHO_LARG)
Y_BASE = (COL_LADO / 2 - BASE_LARG / 2, COL_LADO / 2 + BASE_LARG / 2)

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


def caixa(x0, y0, z0, x1, y1, z1):
    return Manifold.cube((x1 - x0, y1 - y0, z1 - z0)).translate((x0, y0, z0))


def salvar_stl(m, caminho):
    malha = m.to_mesh()
    v = np.asarray(malha.vert_properties)[:, :3]
    t = np.asarray(malha.tri_verts)
    with open(caminho, "wb") as f:
        f.write(b"suporte notebook elevado".ljust(80, b" "))
        f.write(struct.pack("<I", len(t)))
        for a, b, c in t:
            p0, p1, p2 = v[a], v[b], v[c]
            n = np.cross(p1 - p0, p2 - p0)
            n = n / (np.linalg.norm(n) or 1)
            f.write(struct.pack("<12fH", *n, *p0, *p1, *p2, 0))


# --------------------------------------------------------------------------
# Alturas possíveis
# --------------------------------------------------------------------------
def posicoes():
    """Lista (z_fundo_da_coluna, furo_torre, furo_coluna), do mais baixo ao mais alto."""
    pos = {}
    for zt in FUROS_TORRE_Z:
        for h in FUROS_COL:
            fundo = zt - h
            if BASE_ESP <= fundo <= TORRE_ALT - INSERCAO_MIN:
                pos.setdefault(fundo, (zt, h))
    return [(f, *pos[f]) for f in sorted(pos)]


def z_pino(fundo):
    return fundo + COL_COMP + PINO_ACIMA


def altura_apoio(fundo):
    """Altura da superfície do trilho (onde o notebook apoia) com trilho plano."""
    return z_pino(fundo) + TRILHO_Z1


# --------------------------------------------------------------------------
# Peças
# --------------------------------------------------------------------------
def nervura(comp, matriz):
    """Triângulo retângulo (comp x NERVURA_ALT, 6 mm de espessura) posicionado pela matriz 3x4."""
    tri = CrossSection([[(0, 0), (comp, 0), (0, NERVURA_ALT)]])
    return Manifold.extrude(tri, 6).transform(matriz)


def base():
    pe = caixa(0, Y_BASE[0], 0, BASE_COMP, Y_BASE[1], BASE_ESP)
    corpo = pe
    lo, hi = Y_COL[0] - FOLGA - TORRE_PAREDE, Y_COL[1] + FOLGA + TORRE_PAREDE
    meia = COL_LADO / 2 + FOLGA + TORRE_PAREDE
    for xc in TORRES_X:
        corpo += caixa(xc - meia, lo, 0, xc + meia, hi, TORRE_ALT)
        # nervuras triangulares de reforço (2 para fora em y, 2 em x)
        ny = Y_BASE[1] - hi
        corpo += nervura(ny, ((0, 0, 1, xc - 3), (1, 0, 0, hi), (0, 1, 0, 0)))
        corpo += nervura(ny, ((0, 0, 1, xc - 3), (-1, 0, 0, lo), (0, 1, 0, 0)))
        yc = COL_LADO / 2 - 3
        nf = min(25, xc - meia)
        nt = min(25, BASE_COMP - xc - meia)
        if nt > 0:
            corpo += nervura(nt, ((1, 0, 0, xc + meia), (0, 0, 1, yc), (0, 1, 0, 0)))
        if nf > 0:
            corpo += nervura(nf, ((-1, 0, 0, xc - meia), (0, 0, 1, yc), (0, 1, 0, 0)))
        # cavidade da coluna
        corpo -= caixa(xc - COL_LADO / 2 - FOLGA, Y_COL[0] - FOLGA, BASE_ESP,
                       xc + COL_LADO / 2 + FOLGA, Y_COL[1] + FOLGA, TORRE_ALT + 1)
        for zt in FUROS_TORRE_Z:
            corpo -= cil_y(xc, zt, FURO / 2, lo - 1, hi + 1)
    return corpo


def coluna_local():
    """Coluna com o fundo em z=0 e centro em x=0."""
    m = COL_LADO / 2
    corpo = caixa(-m, Y_COL[0], 0, m, Y_COL[1], COL_COMP)
    zp = COL_COMP + PINO_ACIMA
    aba = circ(0, zp, R_ABA) + ret(-R_ABA, COL_COMP - 1, R_ABA, zp)
    corpo += extrudar(aba, 0, ABA_E)
    corpo -= cil_y(0, zp, FURO / 2, -1, COL_LADO + 1)
    for h in FUROS_COL:
        corpo -= cil_y(0, h, FURO / 2, -1, COL_LADO + 1)
    return corpo


def trilho_local():
    """Trilho com o pino dianteiro na origem, deitado ao longo de +x."""
    barra = ret(-FRENTE_EXTRA, TRILHO_Z0, DIST + RASGO + TRAS_EXTRA, TRILHO_Z1)
    batente = ret(-FRENTE_EXTRA, TRILHO_Z0, -FRENTE_EXTRA + BATENTE_ESP,
                  TRILHO_Z1 + BATENTE_ALT)
    corpo = extrudar(barra + batente, 0, TRILHO_LARG)
    boch_f = circ(0, 0, R_ABA) + ret(-R_ABA, 0, R_ABA, TRILHO_Z0 + 1)
    boch_t = (CrossSection.hull(circ(DIST, 0, R_ABA) + circ(DIST + RASGO, 0, R_ABA))
              + ret(DIST - R_ABA, 0, DIST + RASGO + R_ABA, TRILHO_Z0 + 1))
    corpo += extrudar(boch_f + boch_t, *Y_BOCHECHA)
    corpo -= cil_y(0, 0, FURO / 2, -1, TRILHO_LARG + 1)
    rasgo = CrossSection.hull(circ(DIST, 0, FURO / 2) + circ(DIST + RASGO, 0, FURO / 2))
    corpo -= extrudar(rasgo, -1, TRILHO_LARG + 1)
    return corpo


def pino(comp):
    """Pino impresso deitado (alternativa ao parafuso M5)."""
    cabeca = Manifold.cylinder(3, 5)
    haste = Manifold.cylinder(3 + comp + 4, 2.45)
    p = (cabeca + haste).rotate((0, 90, 0))
    return p.trim_by_plane((0, 0, 1), -2.45 + 0.5)


def trava_pino():
    """Anel que entra sob pressão na ponta do pino impresso."""
    return Manifold.cylinder(4, 5) - Manifold.cylinder(10, 2.3).translate((0, 0, -1))


# --------------------------------------------------------------------------
# Montagem
# --------------------------------------------------------------------------
def montagem(fundo_f, fundo_t):
    col_f = coluna_local().translate((TORRES_X[0], 0, fundo_f))
    col_t = coluna_local().translate((TORRES_X[1], 0, fundo_t))
    zf, zt = z_pino(fundo_f), z_pino(fundo_t)
    ang = math.degrees(math.atan2(zt - zf, DIST))
    tr = trilho_local().rotate((0, -ang, 0)).translate((TORRES_X[0], 0, zf))
    return col_f, col_t, tr, ang


def main():
    os.makedirs(os.path.join(AQUI, "stl"), exist_ok=True)
    pos = posicoes()

    print("Pos. | furo torre | furo coluna | altura do apoio (trilho plano)")
    for i, (f, zt, h) in enumerate(pos, 1):
        it = FUROS_TORRE_Z.index(zt) + 1
        ic = FUROS_COL.index(h) + 1
        print(f" {i:>2}  |     {it}      |      {ic}      | {altura_apoio(f):6.1f} mm")
    folga = math.hypot(DIST, DIF_MAX) - DIST
    print(f"Rasgo: {RASGO} mm (necessário {folga:.1f} mm para {DIF_MAX} mm de diferença)")

    if "--check" in sys.argv:
        bs = base()
        pior = 0.0
        fundos = [p[0] for p in pos]
        for ff in fundos:
            for ft in fundos:
                if not 0 <= ft - ff <= DIF_MAX:   # traseira igual ou mais alta
                    continue
                cf, ct, tr, ang = montagem(ff, ft)
                vols = [(bs ^ cf).volume(), (bs ^ ct).volume(), (bs ^ tr).volume(),
                        (cf ^ tr).volume(), (ct ^ tr).volume()]
                pior = max(pior, max(vols))
                if max(vols) > 0.05:
                    print(f"COLISÃO frente={ff} trás={ft} ({ang:.1f}°): {vols}")
        print(f"Verificação de colisões concluída: maior interferência {pior:.3f} mm³")

    pecas = {
        "base.stl": base(),
        "coluna.stl": coluna_local().rotate((90, 0, 0)),      # de lado, aba na mesa
        "trilho.stl": trilho_local().rotate((-90, 0, 0)),     # de lado, bochechas na mesa
        "pino_torre.stl": pino(Y_COL[1] - Y_COL[0] + 2 * (FOLGA + TORRE_PAREDE)),
        "pino_trilho.stl": pino(TRILHO_LARG),
        "trava_pino.stl": trava_pino(),
    }
    for nome, m in pecas.items():
        bb = m.bounding_box()
        m = m.translate((-bb[0], -bb[1], -bb[2]))
        salvar_stl(m, os.path.join(AQUI, "stl", nome))
        bb = m.bounding_box()
        print(f"{nome:18s} {bb[3]:6.1f} x {bb[4]:6.1f} x {bb[5]:6.1f} mm  "
              f"vol={m.volume() / 1000:5.1f} cm³  genus={m.genus()}")

    fb, fa = pos[0][0], pos[-1][0]
    for nome, (ff, ft) in (("montagem_baixa.stl", (fb, fb)), ("montagem_alta.stl", (fa, fa)),
                           ("montagem_inclinada.stl", (fb, min(fb + DIF_MAX, fa)))):
        cf, ct, tr, _ = montagem(ff, ft)
        salvar_stl(base() + cf + ct + tr, os.path.join(AQUI, "stl", nome))


if __name__ == "__main__":
    main()
