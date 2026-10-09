#!/usr/bin/env python3
"""Exporta as peças montadas (todas as posições) para o render em render/modelo/."""
import json
import os
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(AQUI))
import gerar_suporte as g  # noqa: E402
from manifold3d import Manifold  # noqa: E402

VAO = 200
saida = os.path.join(AQUI, "modelo")
os.makedirs(saida, exist_ok=True)


def salva(nome, m):
    g.salvar_stl(m, os.path.join(saida, nome + ".stl"))


def cabeca_parafuso(x, y, z):
    return Manifold.cylinder(3.0, 4.2).rotate((-90, 0, 0)).translate((x, y, z))


a, b, p, _ = g.montagem_travessas(VAO)
salva("base", g.base())
salva("trav_a", a)
salva("trav_b", b)
salva("trav_pino", p)
salva("pes", g.somar(g.pe_silicone().translate((x, y, -1.5)) for x, y in g.pes_xy()))
salva("paraf_dobr", cabeca_parafuso(g.DOBR_X, g.Y_ORELHA_A[0] + 0.2, g.DOBR_Z))
cena = {"off": g.deslocamento_direita(VAO), "y0": g.Y_BASE[0], "larg": g.LARG_UTIL,
        "dobr": [g.DOBR_X, g.DOBR_Z], "pos": {}}
for i, x in enumerate(g.ENTALHES_X):
    braco, tira, escora, th = g.montagem_modulo(x)
    salva(f"braco_{i}", braco)
    salva(f"silicone_{i}", tira)
    salva(f"escora_{i}", escora)
    salva(f"paraf_pivo_{i}", g.girar_y(cabeca_parafuso(g.DOBR_X + g.PIVO_X, 0.2, g.DOBR_Z),
                                         th, g.DOBR_X, g.DOBR_Z))
    cena["pos"][i] = th
with open(os.path.join(saida, "cena.json"), "w") as f:
    json.dump(cena, f)
