# Gera preview.png: python3 render_preview.py . preview.png  (requer matplotlib)
import sys, numpy as np, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
sys.path.insert(0, sys.argv[1])
import gerar_suporte as g
def add(ax, m, color):
    mesh = m.to_mesh(); v = np.asarray(mesh.vert_properties)[:, :3]; t = np.asarray(mesh.tri_verts)
    tris = v[t]
    n = np.cross(tris[:,1]-tris[:,0], tris[:,2]-tris[:,0]); n /= np.linalg.norm(n,axis=1)[:,None]+1e-9
    light = np.clip(n @ np.array([0.4,-0.6,0.7]), 0, 1)*0.6+0.4
    c = np.array(matplotlib.colors.to_rgb(color))[None,:]*light[:,None]
    ax.add_collection3d(Poly3DCollection(tris, facecolors=c, edgecolors='none'))
fig = plt.figure(figsize=(15,4.6))
for i,(x,tit) in enumerate(((g.ENTALHES_X[-1],'Posição mais baixa'),(g.ENTALHES_X[2],'Posição intermediária'),(g.ENTALHES_X[0],'Posição mais alta'))):
    ax = fig.add_subplot(1,3,i+1, projection='3d')
    b,e,th = g.montagem(x)
    add(ax, g.base(), '#5b8def'); add(ax, b, '#f2a541'); add(ax, e, '#3cb371')
    ax.set_xlim(-5,235); ax.set_ylim(-60,90); ax.set_zlim(0,160)
    ax.set_box_aspect((240,150,160), zoom=1.3); ax.view_init(elev=18, azim=-60); ax.set_axis_off()
    ax.set_title(f"{tit}: {th:.0f}°, traseira {g.altura_traseira(th):.0f} mm")
plt.tight_layout(); plt.savefig(sys.argv[2], dpi=110)
