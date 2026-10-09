# Gera preview.png: python3 render_preview.py . preview.png  (requer matplotlib)
import sys, numpy as np, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
sys.path.insert(0, sys.argv[1])
import gerar_suporte as g


def add(ax, m, color, dy=0):
    mesh = m.translate((0, dy, 0)).to_mesh()
    v = np.asarray(mesh.vert_properties)[:, :3]
    tris = v[np.asarray(mesh.tri_verts)]
    n = np.cross(tris[:, 1] - tris[:, 0], tris[:, 2] - tris[:, 0])
    n /= np.linalg.norm(n, axis=1)[:, None] + 1e-9
    light = np.clip(n @ np.array([0.4, -0.6, 0.7]), 0, 1) * 0.6 + 0.4
    c = np.array(matplotlib.colors.to_rgb(color))[None, :] * light[:, None]
    ax.add_collection3d(Poly3DCollection(tris, facecolors=c, edgecolors="none"))


pos = [p[0] for p in g.posicoes()]
casos = ((pos[0], pos[0], "Mais baixo"), (pos[-1], pos[-1], "Mais alto"),
         (pos[0], pos[0] + 40, "Inclinado"))
fig = plt.figure(figsize=(15, 5.2))
base = g.base()
for i, (ff, ft, tit) in enumerate(casos):
    ax = fig.add_subplot(1, 3, i + 1, projection="3d")
    cf, ct, tr, ang = g.montagem(ff, ft)
    for dy in (0, 230):          # os dois módulos, como ficam sob o notebook
        add(ax, base, "#5b8def", dy); add(ax, cf, "#3cb371", dy)
        add(ax, ct, "#3cb371", dy); add(ax, tr, "#f2a541", dy)
    ax.set_xlim(-10, 200); ax.set_ylim(-30, 280); ax.set_zlim(0, 200)
    ax.set_box_aspect((210, 310, 200), zoom=1.25); ax.view_init(elev=16, azim=-50)
    ax.set_axis_off()
    fz = g.altura_apoio(ff); tz = g.altura_apoio(ft)
    ax.set_title(f"{tit}: frente {fz:.0f} mm, trás {tz:.0f} mm" + (f" ({ang:.0f}°)" if ang else ""))
plt.tight_layout(rect=(0, 0, 1, 0.95)); plt.savefig(sys.argv[2], dpi=110)
