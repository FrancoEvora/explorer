"""Original Solaris ambient instrumental, generated deterministically; no sampled music."""
import numpy as np
from scipy.io.wavfile import write
from pathlib import Path
import sys
sr=44100
duration=30
n=sr*duration
mix=np.zeros((n,2),dtype=np.float64)
chords=[[48,55,59,62,64],[45,52,55,59,60],[41,48,52,55,57],[43,50,55,57,62]]
rng=np.random.default_rng(20260925)
def add(note,start,length,amp,pan,pad=False):
    t=np.arange(int(length*sr))/sr
    f=440*2**((note-69)/12)
    if pad:
        env=np.minimum(t/1.8,1)*np.clip((length-t)/2.5,0,1)
        wave=np.sin(2*np.pi*f*t)+.15*np.sin(2*np.pi*f*2*t)+.05*np.sin(2*np.pi*f*3*t)
        wave*=1+.035*np.sin(2*np.pi*.15*t)
    else:
        env=(1-np.exp(-t/.022))*np.exp(-t/1.5)*np.minimum((length-t)/.4,1)
        wave=np.sin(2*np.pi*f*t)+.22*np.sin(2*np.pi*f*2*t)*np.exp(-t/.8)+.07*np.sin(2*np.pi*f*3*t)*np.exp(-t/.4)
    wave*=env*amp
    ids=(int(start*sr)+np.arange(len(t)))%n
    for delay,gain in [(0,1),(.22,.13),(.43,.07)]:
        indices=(ids+int(delay*sr))%n
        mix[indices,0]+=wave*gain*np.sqrt((1-pan)/2)
        mix[indices,1]+=wave*gain*np.sqrt((1+pan)/2)
for j,chord in enumerate(chords):
    for k,note in enumerate(chord):add(note,j*7.5,9.5,.033,(k-2)*.3,True)
    for k in range(8):
        note=chord[[0,2,3,1,4,2,1,3][k]]+12
        add(note,j*7.5+k*.9375,5.2,.075,float(rng.uniform(-.45,.45)))
mix-=mix.mean(axis=0)
mix*=.48/max(abs(mix.min()),mix.max())
write(sys.argv[1] if len(sys.argv)>1 else 'solaris-ambient.wav',sr,(mix*32767).astype(np.int16))
print('Original instrumental: 30 s; peak',round(float(abs(mix).max()),3),'RMS',round(float(np.sqrt(np.mean(mix**2))),3))
