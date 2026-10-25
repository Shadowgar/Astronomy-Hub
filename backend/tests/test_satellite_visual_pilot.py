from __future__ import annotations

import base64
from datetime import datetime, timezone
import hashlib
import importlib
import json
from pathlib import Path
import zlib

import pytest

from backend.app.services.satellite_feed_status_service import build_satellite_feed_status
from scripts.skydata.build_oras_satellite_tle_release import (
    DEFAULT_MINIMUM_COUNT, _nested_gzip_jsonl, _read_nested_records,
    build_release, read_validated_release,
)

# Exact offline fixture from caelo-works/tle-mirror revision
# 38a142645e7814b538daaf5868b814550e1f0dda, tle/visual.tle.
# Compression keeps the complete 155-record real source fixture bounded.
SOURCE_BYTES = zlib.decompress(base64.b85decode(
    'c$|fu*>W67az)?kEAmOkHW^B>FOO&v)5J7Mi~w@fGyne~I@cqsGNM4%w9F(D00Xx?e7U}b9>0HieA_-gef$3S<8=$$<-'
    'e2PoGU&3*h+M%KJukdLa*oOOAW2WZ96;u3%-'
    '|a)1TabJANj|=pW+7AA9fl6vipr7Tr1K*0z}I+4Hr{<&<*ETj=GSi|gB#+u8XVHlNNuwCYpIzQkV3>HFuG*X{9-'
    'r*Dtjr|tEBeqTV=7y+4pa)5Lp@QYmCK{_AO1hV+-+C$nwRs+c?`Wx6<-(m=7KBZ2N!6i_Gsky`<DW6@ANg!kLF87>5^)95-'
    '+ZR6f1a1M@YBi8K{(c1+a)>><a0OY~1TvSF$`zzHkemW~5L5)W1%Gy>b^~8a;P3rhz4x1s{oHab0$F@&(dmDj?_D6<uRw<80wAkP'
    'c>?KrZmzp4$T(kj%BjRF$R?0FW!q}v$GP{={F#G_)F6jawh+@fv>rDf@;Ufs*PU{WzLn;Kq<t4;4AB9S%Wwxs&(SgP$#<RPLr)-'
    'm>)u^;(ym*l43N>aEx2+{(meiYLhrbLe=aU_9kHEblujb_6kG7Aqf0U8)63(_WG*)#bJuk@@7+Zw%emH`Ymdiu=R8ZYw0K;%8IDc'
    '?K|1#y`DhhPu{r&d+$Gu=&L|Yu9V%$MU3aRnhlnI{@Fks|-'
    '=5z#{|k_%bU=3Q=>XYFNAG;Qg4AUmhSOR<45u4NPT98B&MA5>6*K3C`{t`Ftvb-'
    'RGw1R-HvUjDhU3pTl#F#E*c3xKy*<5t|CuNSk{>{l)lDGLNkr9C3fsc~3C!7Wa?Ncu9Gzm;9eUup1CFNKb-Tn_ShqW4CWzF<Gv>l'
    '|$8&Bq>Ekx<dhB<tJA2;%iLBbBlL7CA;+Z6|${-;e*Bx3)SDh>ZsZ)>=_7Z&9%>y^fKd8P&N%Y(U+KM{!9V`-'
    '^Y+M&V>9&yY7pKR!?@xdI<h~6gPS!xSS(2%hTJd=Mb;mlpAS^$*RVQ@{e+xJoZZ`lj`z(-'
    'rRyil^g@0Aef)H(!PG$s%T7nywU+!8re!xI_-'
    '!GCZINsK<xU_@JS>EV~I4yJCan?zlg1y9ZYg{*<`0ULEWz+_Tvtchepb;_Va}1IshQlw(d^%J-'
    '`e4=_w+|m*{_*ts?fK)6x8DwsgbyN4#cSj#;^1UrI-EK2XV%Fu`$^MDor1jZD^7o?TxJ_O$;Tgl65~R~J!1F1nlmSmx#SUW&nV5~'
    '61xwP?jZ9H^3X}VUGJe>oVj;pwr&Mnw@R{@lQNKUsi`XT6bp-'
    '$V|>I;P;L}~Yf8Z+S+SUcuWU8r1MXgTOBokb(flxhB=XkOkJ!Cfck+CIHFoQi;mnJ}<M?*2rN~eE+(W<x;U1G@>~Wa#_ln((d+)8'
    '3lB#R>teao&VL`Q`R#RB?MXqnxN&I}8!y=r>wS@)QDf|u1YoO&C@q)4HpAc~QEu|1(U_rjaeq89X?ksym2XK|8$xlAMJ$`?0-'
    'UbpM3&@7#C#r^@^}SssNnD&k3iWc`c8b}H^h`cQzT0#X?-'
    'fTdAK|@;4n;E@lru?n;4;NYl6=tjq7+E^KtOh6G5JY8qc>JDK&CqDBzjcWu(*5D7S5ti*a@Vk;I`y~l3b8j5W$FhcV~ixf$V`#mC'
    ')vb-}U!&()(PKfoy%c?wULF%wKh~E)k~_ZLc7mf#j5-'
    'lhqH8Lm&|mgg`h&YU~7e2xrSskKF|!aDE(|{7AkpNo?fD*5nN*NpeT1&lO}UGYd*+S6yPaoiZfpz2YPCYQ79--ZS5C=hCATL3GF&'
    '$d3F2pC!Y6W4tTL01pKuY(GxUT;xwg&_F`d-3&7Gvwfjzc8Y=IpAnoYl9XG-'
    '!Q!i>v&3$fgN_F+Qb(d5$1hS06M?bawQd}9Hjt@I*WJZcFJTdL4D)pd%(GrWHUr5iBX-AVo|GV-O_Euh9rBIflwssf`j9PlCzumH'
    'GC|p@&-'
    'X!gmju$gDShxH0Yv?a;l#EWjw0S6$!H+EWDQ81Iw_6gGSNYS^hy?jQnV(c4xNZo%mu+EQA=eTDBFFI5pNI3K#DMf?BYQe7Zg*hOT'
    '<CjSCBeofK>iPigeE66H=9ycUlBR1+5slOi3X56+vtga_;Vf^f?*GI9WGYND<6S`T&JqKyr(#GuJ7*B)uX|AhKpfoG4l1Cm}tsP>'
    'bru#-'
    ')=)#ahWOeDN{d2bo+nkac!J<R<*43rO<aK7+(^+G;pDWq?eOpMV7svXkXFJ;}{mwumINJ1bQ&NtT*$$0Z@>6z{qq7})^Xr`Qd*fK'
    '(mXVq7AQved&*CIgujnB{^>5=b#KXR({uoXx01P`0R`#1~~+B#H=?UxYL7_hWZ#UM`4hafb_n!H_n$J;&iH7Z!xdP1&MZw@xuhI-'
    '`#=b63r9;>Z@2H>tt^9dd9Fi{1Dq{5q)v-@bp{@TO)U>zsGT-hA^H(hIxniwnZDE$M@uVg#co??&l3q6j2;u`(J!;<5cmz!fm%f`'
    'VKSSq9NNh118Ex34eci&@e579=47kk~?;2?nOq!<CtbTo;h8#Vbg=Zk;l&n;e?Bg75ZiNRsG8YNLoFhDNfh>dMebC>=VBeE8>gbu'
    'yuj1~SZ44ae5XRg&n<9C0EtNeiE}Q+ALkTji=W*DWlX06RHOkopufB2+hY68El30g<uZCm5Lw6Ob5enPWG()=YZSEXiDPaVtojG6'
    ')8=Mxs7fML|)MD8`W?(q06B^Z{=-'
    'NN*)^P{{xb+NoL)$`9eUcOa_~j7)<3=?ao7f+*mPf0}n=Htw))(@C9Tg$v9VKZ);#fr+XiDtr=pi3^gM6BfC&I07d!C3QeoTDk9n'
    'a!=Vnmc>tI9e=H0L^mg5QF;Cqq(vN^vhzs@p3-'
    'c>l<8zA9P)kON0J^q9TISLTsM3Wu0?tU=Qfb#7a$ADYasiilfKuIOO97&?w7ELaO!H^I>jV8vPC$q3P$=Ty@{a}bTVRFaJn-IkLe'
    '^iMIhnEwUaG|yOJ!a7eJOpCy9uPR@am^*F`7g3sz^YQ!bKhVw`8rQN$sg1HPrSWQi8UEmxK#tAm+>k+i$ks|zBQzXw^(nG<5B90%'
    'tm<JduB9Aa4q=`DE*i$jvt?=A?sjUaJBttP9gl`PU5NfHyxJP|2!7-g2gC*%f{_0@D=k`NvPIrB-EakD|G^hGD<Y%zvV+nPS;6a#'
    '71s1UH-'
    'p1QFhNW>@sB|?z2wW+uzNs@9De3vp)e?NUFtqqVlA7PQCL*hGPcb&^Dk<{==AA*5w?UFtKCDeeK7bCsg9@%2=M0F7W&|*bp2MOuq'
    'x-;IuogV-'
    'G{Py^~eR%rg?VSr!ATW@{PX#OPsL6+1Tu|#vBGw?it4=DMkXM}5hv0U}arpg4dda)w?9oXnCkc4*O2831X|s}2)ESa~SCTa=rA3K'
    'DnywrF)zI`K;>-jiCeo+Xnd_8`;mA%@pG?D<E6c_uB4aE`g?+9)4;KXcQD(w-'
    '^I<qGzBe4u^Z|0}<G`nhx#=2l+``OLhW6irl&n>S#INHGGuAzrxoXXTgaykNL5j|**O?27%1f|Ln1%~?{UjN-+d)o#63-'
    'aAzeb#;X8w?sr>)mrjeMG)^zz+VS+VkNr`jK1XlKX{4%2z)aP$U}oV%jBTdLLh``1l^VIbpF=|z(XA}t=Iw=RZ*4y_dooiePu_rW'
    'J|E+V}u?nR?&(C<7PW-'
    'h}|X2LcXhJPY6I<8wisdpf2G>~aF9At%}Ukyh!#zT@M%6@G&*(rA2aO|{OcQ=r@LO=Qv_+E?Z(JEI+G7(G*tUx)y{n*{ChziI&li'
    'mUwNbXv}kTpyMqeE?1NjATy5148n<wzo>Nz$pXpFFCF<K!pLL7Zy1po*_kGR?0)Bxy~GTaay7cX5*>V=gd*g9YU!TWoIXKC}U{?Q'
    'J`2Lvp*g70YqDDsrL9sHHv)=cFGIRr5LEi^G=jc>h6?L{~tPpRZN58cckbh_g6z1(=np>6G1>!<|O$%=h8U#mphSRzHLfoYlD*l7'
    'tvXQc|prZ1Ez={u39}dTs_X%#y^#lC@v_B!<4!CsCrcm29W%AT#PqScGh6i``M}PK9dRI^RHoC0PXnzZpABhO~ej>TV*|3EBoS&M'
    '7VbOPu;r!KirwS-7P&$LUrJR;4#NH9*}tD&EUas&>l7s!JyiT1iFg$h-Ls<dTkX*HXRfCspDYAeZ_iFi`8GKDp?mOH-xS2!>7>e$'
    'vZ^o#bR)TDV40?KJWQ)wH|{``(y2Ur_JCb3_YA#Oe9{b*tWLAoG0PS>+#p0ja9?Y~47hn=*?|8Q1NUEjHu@x>2x_NpZ`hXi9do+V'
    'xeE<j*Q%)s4T$`-xa5T^%6fOx2Vl)oVF=?RS&m-dcCJq}LKLmC48!q-'
    'SQ`9c&N@wUPmuLEDEUqe|da<r!=xACgqb=oVx)XHEhdXGtpLgbP(Gaj69%wW)||)~!=6R1H3nB*|{&Xc8iE_DK4O&V;IAj8VZrp-'
    '_q3H*)pSl>em*>Q*y1kaLa`Ll5pM$>`_aVk8XLHR5!unF}OBkw@YWVL0=q%H>vcrn4YUd>MH+`ly@^jfFAYHyq-'
    '=K*A~Jh?Dtv1mE46huOLxG}mz$j*(uSav>PSiUV2YLQ@p^Sm+~(QM0ZSW;McMA+@Q}YLum%p1*y6dfo3lqy=P<j|C(a=H}ia{yR-'
    'w+P;+jbWh85htcUll0})n%!7nl?6(O87&YEfmE#b4va();PD+a95Jz*)cl$UxKI|Yr9+D)%73Vk%XSr^rgv)i?DdW1;i&t1ont<_'
    'vScPul5Y(+x|1OA`X9H;+NeEKIafZ{Ur!U_hH~$W%fs7#zkaMM1^ESy{6S1(gk}WY=!lIpG&RlJ}(Mrx%*oP?+vPrG2DQhhfh<F_'
    'RZlv70W(^<}r^nal$8S$tayKvyWJ-YS3SgfPkg8^rY#wt#b4rW;g}C%_>=gdi)SSzR+MP=-'
    'meS&hybX$E3)yOXyU|KUhlm*|NF&=db_W}Jc?VK0lCDO`%qJtht6a(~h-s-'
    '{z`Dv(M72`}Rjay7{(wpwGe;A><zIu%sbGaywb+e$s(y}Y)_T_k>G-'
    'mPoSb=TnpHboP+ZH=ILcc|mU4+WMeZK<+pCqMLmo+D%X?J~W^UKrIETQdPH9Yc^X{M-j{&kxc{i3_T$@PmLe=n~e#yJ-luHFe?xS'
    'CwdA0eCf-'
    '{df?vr(CWQ&l&)S;Sy?(y{b?fdq#{|3nB3}l=Vv8b;eVNorN<+@X^H!dhQ8_w9dPOW2R#hEu(Mw8E7W**ExMx$!_tX0MhcW?2YGv'
    '^1x(8;;X;`yth|J9inw>Wd+`i)L<%1CL|C0D5SDpbkjEM$AWQ}m(nld2DyGgnt$JgDIV`e8WjT_VQuWmtF4$AneUh?dRo4bmG{XI'
    '^TKH<B!}e`t3lc9|p-{zYMtu<UH0GN=u~FW{Q9H9#E>Kwb4-'
    '^(RTP{G`x(0a<pCN2Qk!Df)5&>1*jLGq3Gdk}@0vsRV}4NdjV1e@>A{vx<R#M%eGl65|-CBg4q3g-'
    'T=L9#spfs2IpP<=vRGQ?>ZorOgYUMCJPuyX}<GN_M*UB-_oJgoB&ma5S?NO~<2RQMTd$8HcyApoF(`cR>;z$Z@(~3;W8uFJoZ(FD'
    '+pa6<t}7oiacseV)yoT^C5MyIPK;A}YK>8Tn;ajn5TIRNO(3?ey~J)8n^?c#Cm>j2cbsqKK0-cN!b?@p|21nP%~&-'
    '#Bxfvhzues#p)!(g)I4vg}X@i(Wd@$$m;4^OIQ?gJr9hdKix6{0?La!9b?4L>zeTl?C~=91W+Ly0muPI%O{o@T2^5E+d(r462=5v'
    'q4=)yf$t=4#SZoNM~DDG4-x9=lHmToLkAz6V*B|&U_gZQUA6r1uHvc2dOEhO>WU!aiFM=qcU46-'
    'P%SZyTNp_iG}K>TTx2;^!oPjlNrwe(wI3Q=R{0x%wVnA9b}rFdH1b^CC3S4ngxPURbIzUs|FaX-'
    '`#CcD5@RdNB6<Vy9h>BkE=G)B67}qEC_z=c94IYKn69{4oNOmHBCa+rDkrY7)Y;FP!)_g49BU+VB?>1z#K2m-'
    'i(=xV8T>Es%&Lt=J^JswUPnZ%G7;uI0knN)Dc@}7ep{SoVgJU-'
    '}df9(Z5ogvn9<aCer?_yxYdggN#n(U7Sr?n{oS%a36<G{@Mk#Drc_h*F3AHqy^2tw(aK9A0E`-O0w0#f_hMx=ZKc9BZl|p11e-'
    '!d8r8dC1^TxLAh%*2t{%KVZth?uVx^_GQy2_)7;y&9KASm)o5=(_Si0SLCyq+gNdU)saQn%pgNyQk>{joPXn0?L<k!vPKMKux5us'
    'hd^(!rRaFznDeorg$6}?YOOCV5swpnsIP-'
    '2*HI@FnRYf6WM%9#sjQ(v&UR5GZ`=wF(3o4cugjvbPu6{B|ac)5Biw3fmX@olln|8YzPMG<m*P_HSC=$leN@?+XW*(idjRvUZL%c'
    'q?)lNk)(&#NFC6kyp8Ckm90OcqZtPJF&lT8`~3%Zn}=fUF#)O8w{%>$$rtVGpBm_)>b%};6v!;NVcjmhKD&%NzbjWkhnF_p{q?vP'
    '}7A93Ul4P=`q_6tth%HYGgi(g1@Z2qurKS0KE6s$HmnlPrLv(wO*lEj?N!p=mQF`9@6L1jrjQy&vncO==efn3Tg_>ZE7!nJ~t7t)'
    'J#*088k#&rivTv0(dsZFA4l02$2(o|l{n%Ez`McsdeUeuIHsU}Ij&ldUGkYrDD?ACBrIb!#!lU!PT2lCQNcB6bBn@zK5uFYHFq89'
    '}k?!C8Bj_xQx)yTeg`^e3&C7F%%@>$E2i1i$UHJ<luvCV@b;urD8aBTYS+LZ4ZNoLbYuMV<0BPF)cE5Yn`Nk&m5<=)WvLy{@H2gy'
    'e@kYSc&A{7qT^(&jFm~}F`b$H26xk!@Vp?;^&R-YshCw6Deg-8`)8kt}{Bnfv8qP~eQ-Irw3tXfy8Yo4D(r?bB{o5Eb!e;|?UWld'
    '>y%CPRH2(5I>+h&t0R_ZNQ?Uy8*7|CI@NW@Z!U7AVhA>AbyYIPdO;-@l;JXcLenI+7FB1Mykt25UrMlj$y{9*H|nVX-'
    '~)H10}#H3VV2&z0pH=H@?y~;pPPCpq=eQ!9?soB)i5^)^b(%aF;aZ6#J&tK9S7In(*%;OjXiYZzx$fo}`lcYvcZT2P&Kbewvj5G_'
    'Yy?fnp<TwI36$hfaK;gLVdE4%x%K@)tmS{Q7aOT<4Y@l@O<7BQ~D-YSa8Mt|PQN85dC8~2pDt6yb#%NVF-'
    'R|Tk;bNuErN7y5lC~UgK*lsme|XnoYX!;M?gOz&lLJk&N}%SGW9HSIx%M&~DLh1dUkUs*$mH?>xy-'
    '6zccB~;`);*vKG9knh*r!r!wLE;tg%_m+(mV1wGtS#ph4I_H&wz+l9@2B)d!7?9ES7XD^dfQRgPBCbnY!8t7;SDyWuPq47`)iH#('
    'V>Yshf4ZKWJ1v_4i{R759CYX(Otnm;F%2`znS-PsN(^1a&;g9ex+39)l=0L@b0;z-'
    '1nmB5mwW|R5JXu2`NVzbyy^tVKeqne`qS$*IEvh`gj$r}iZMFghb1xbvT;S`rANd}eW!$H;j(jw{d?#ry2onqIm?(W`f%6qn0`xp'
    'oE`+!gkqx47m(8)wdOv&-v>E-qJe?C9`-xjtHS}6Jc`1;!cvS~E2R}zo8-%Wt^NB6<EIi;<wPw9hEHJxJDtu-aJC(eEJyR}TKU6r'
    '7fE`HFQQyG3TLwO^bl2r4(E6GeK1*G;*{+O&AuaoOhW(iA~1;!Ltozy7<B#g%9%+n}XL7gwF8&P8|t(;YY9n}JoKip8N@S*#pm+#'
    'jBavpEsV_SFp;wR@8$wSvj!s>!_%HE}wxfKn2jr5^t*~(}UC)=C@8ZoZB1o7TvqZsk@{Pwne`1j-'
    'MzaHP0{&G&qK$iKsT^FgiL>$t)HGLrMT1l@?F;y(e{8i~A$1-Ow7|34rHmR*Pzr`3ec-'
    '%EAuabwaIh;QJ`vFh=3rUi!0a7KqquJ!J4NcP@RkdZ+#g}{&ade7ZcQIxb^XNL+#-'
    'mglT7<|*Y4M<h7h^%1w?W&r*OpV+t7<RX?SBTcX}J=Rb5%`q)hc&g_i@rfFjAc+QO%j_6pJ`r3@sWn8>5Nd(%~A;*5nTj5|>Bp*0'
    '_n*8B~86!|=b>$!5;Huag5By`BihI=qyTKwb-0I%R-V#V2M-($)&RrpT??6m0eirh#XSd%-'
    'GckPpVm|LkqM@YA+k9u*9Z^iPK*35wCrP5BvQ5lLER)$A10$uZ;Q$YfOEg?M&txWHG=qg;&L+p`4bC-KCZTqF(f@$~uW%d?vDKb2'
    '(HIzJ%iZ98Q=X<n{e3;XKXujxa!jae0}vPuB1XkvR52W&vJ*s25HA+ZRxj?y2|J%)xqhx6vs_ovs_$9Ece0jbv;1hUQPLr^FBDE%'
    '!(R4&k!8%b)_+^#!nt_w$_U3~*-'
    '<Fd%O%ijabT*r8GK&C?ugh2ECK8}_fe;9zdW=`M^%0;gPV<|_gbh%d5bjqHH!T)1ai^SQGCt<SKuwN=+pB$*;%>l3SBq><LDU*bJ'
    'fBydXZF}#93}jLfRTex`H7&ksw(#=iz*0noV8k1Op;HhslGN)NUR4zwi(HUa<g~$a)^M!NnU8jTCP%4N+Q_Y?;7?EA{`ssG(4Sp*'
    'jmo<<_%^v9O?S9_>^``(42qCDm9^5VQ%onLn7KAUaesE*9=jlq)CQocblO+;<uc9E_~%*E9ys&oPfve){%iZM?LsWWKTN0w(hB>4'
    'ocScKEOQ%&buazyO33SLB37-iFK4c*CPZCjcXL4+g|IIu(ApqnkK-MTsKLo5E?Klo`}n^<er7ipkZFLNyAOob+78lN(mJbF-MTt$'
    'rwr0-'
    '3mQce+k=_g3iZ~6%?g$330ieXfm4+uVxyX6cf+EdP8cB55f;4$aNV(1VD;341yycn4U0PE!h(W5*3dPg<kVu;bOwo7SBfkb)WfiD'
    'pHNdhd!h~YeERzQ>E-o#dw$+NJbrq5d3$(%{_P6V-oXH5o@?ew12TsT@_l`CAWuV{MtZBggCUSe-'
    'B=?IrjJ&#oJ7%}P*>WhS(0vrebR2H;TJLHSWcfGxXNFYqsfc?4)TaNIPVhMw2xC}7o-'
    'LCb@13u8HS@kqY4J`N|G!+hiVHtu|*|2vhFx^GKwKbJr01QynEe*`3^{u)IPBwrHbwFlVRyCsx#qM!_g_jaMWy4rH}LEf)Zb-Rtq'
    'W`XZ6|*?V~<Pic__hOe)#j{T!!7&Gh1eXX_4H%Fwjdh4i+W^eQ=77c}gYy*Qw4Ub5@G*@R`Nwh^+%8_?EhTM;96<KCkjvbt~oL6X'
    'U50~u#NnINL++I=Wma$33%tu6DDc8Z0?C>lXTKI;u0bsw4vS8_qo=4P?(>_<~RYPOQ>BFF-'
    '|K!%UM1gRMejcv|hG2$<RKUySt85BWX)9TE1${-j`jYE#mh}WjktfoOkHT0Z@aa8hGXprGlvzzV{&ct7e1NmoRkq^-'
    'a$bMAS0=iwxvFei6M~z5`Zu&SnWehK=Tch@N)++>>-'
    '$vbykn3Fnn<dHn%S+_4T?089QYS1*lAnGh$*N|P%j<$hsmWUd#`Xk?J$OR|YvDn20X<IRvS!^nWn8zm2crg$qZy8~J#W3<kgHTtl'
    '`DlZuRg9T3i{gaDCzY01vdHN)8q5U&(FWzg6vT)s4Q<-'
    'X$wr0`69`FGkBca&3HqzXM%LysqZOma3kV0X=^6X1pXlQtEV}vVC90n@<QY!pT6rSwYR^6oF}XbjQ(0PuVLM`(|aRpSZsZdI2!XY'
    'N7I7kIH~EqAm1REqm&`4=EoRVFNKfmw87re>GkRD$Lrg}r$4v%eH;>nW+20~`+)jOB`+)pelZga4v#luVBH!Uc<OF7z)kDC$toD$'
    'ZaL~qJscG@rqRcn1F>jnM$aQagYUYao>d%h+7X*#w_LEhrnFrCEJ?2<Yt>1eGUm)R{wrp#Bv5?P+rU8A$c@_ErD+LbNU{|?C8V_{'
    't-9QCLGUF#d!h>6+@-'
    '}8Ytr^`LCdyX41SF`cFJHu8a&=&S0<y_jVlL!%zmso>3OK`M^iqiHh?ts_CwlRBoA+Y{_E@0r}@SWWL8xTkYU+M?j#V`NmLNWg{q'
    'aCCnoHa(dMpJ>2rD~%B<VxI$k^JHvXs0@4aTOA(5aLJct}qZ!x{^h(&KJfdV-'
    '_v{h9nC6zhac1u{~JASclJ7t7LjTeiE!z-*KhRg1@MH01kr!A5a#_*CC!zUz(%=o*-0UaNAkn?mjBtW~gmoDv6*pK3Bi!--V21w<'
    'rO2A3Pt+yC7EvY0iX<Sws;k?^h$*2P9tOinDJpK9d`tt4Z?cr}P-(SAnfF#6ACpDY6ykSM`zdqLC>$)_gRsE%4Wv7gho9K-'
    'e<JH4xC0lt_Q=ev1j_<TK9_wg&>Mm<S7}dRNIJL@|YrSYT9OcBvTYuiIPw|j-'
    'ty?5^%Fs#M03|t$T6GXJ*JDs(95O|{BzDHeMp*RKTFp%_ScH4d94eXwlJp@zO_J=P`RgR=m?}IZndTQo<R|TvVcoXh+q5)d56BQu'
    '(Hc!PjEP#!IqaKFy@>yC*`S1AynTNDI}}5T`Qh#F{Ga2Yt=OZMhOoyxzdwm@hV;gx%(7Uwo160DlXi+B=<0WhPr`!7kZ0AB9hocy'
    'HQ5q`%2eaMpr%i&QROn0hJH2$Hb9mN3-'
    'akErPY?<rTd_#Kh^~eKRq!K4Wu4&v?8h|_JeUYTdpKF>y;zl^wwLnK2A}SQ97Brl?U+laC9RW4?llKPmgGp0dk)DLmyGDtDj5@pH'
    'v~?kYqNHdfUQkK|z|QUaXj&8?PGi9d3DSqXRAv7ldS+b{L@v1o6|q9$)_8wnKjpGHD_2hw30@u3(VTw{oqj4MKDU+45~+-'
    '%c4IwcM(=IozmE0@CeEV;ZEj8gLxhVzahl(1t5SLC@&DzC3*1K74-u{_^!;YX&k#Vz<}O|FV@_@-'
    'a}SuJkfL8A4qoX{Xroh^V>^)WIVyrR~WED&twNsM!)axz6PQ89yFPEiLrZ=fA#w2jP$Be?5M?;gd<9<cGRJ%cgwR=2pFQ#O!ITSt'
    'oIVi%!}p3hLSs%hvBq<B16o(_qCRuZZLAWx9~}ZM&pUpEZORPj8PeA78$1{<hX4kVJU7pf(LJ+0%|y`|#K6Uh?kl=1qCUZaZc7lW'
    'M_2$ZQ4Lu3KZ6O;2!X&Y>2g{bLv&+$!uNTGEF*ev;$0DKD~@z8sQN_aa=ZTZ!lLlBZ8~U1YOUMg=3;bEC*BkC&H(!2*rfpwKn+*y'
    'C@gMAWMw-rgM8CHa$x1EbS|M$o&UOX-'
    'h$bW>A)o(s~#;rb4Sow7?(yR;gH_G!0n&EPaO<=c=X`B&T}sSc)eM}G37noZwv=bxW$*ZGrZ{tw$tn}*@>T_uXX3_saJSx0ViSgU'
    'GwibSj#49%*MX2(8iL4dOdJYBH&wUnET*T6JNhY!GO>e8=NP0w(>1KCWHel1u<xuolKbjs@(7?dxshNDxgEXDV-'
    '<q;Yi)IUMH6>*%cblJlQJ&siuSe72bD;k~YcbPe~PlbK0{kK0Skm{*kB&ipY7G~ZEIZFk@PO*m(ylMejMzuF&ZO~SGOwQ&*@~F49'
    '@eW3XN)pd&kQ2&xK`LwsBw6f4FmU8XRs@pVw1~<2K1O-'
    'L()+qrV5gW)hHCG$dQC@<@dl?S{`6j}HZ?4_?PJco7iHXf7om`<oc?(G^3Pvbcg9qAknQo?;U`IBwD-'
    '7&#lG%75P<r^C+!sO5|gvnGq}_|SdcLl+cV%&v+d!j#XZu8>aDJi^oiYny*|Hvy+yc#R0sBlMmy%Fyx!OK$3t7GEWJfh;;>%#=;K'
    'DUNJ1PF+nB_d3sP%IFZeb!bgEZWFC(Q@ZKukY<AhF+AK%{Z6zm{-)?83nr&(0g4=wDqAdNmRR4wQM89!gQP8rv&03%FlfT)P-'
    ')fv+WuUAz~%ay7e>I=4M=M<00r}OFUACDiOzP|ka{N?Gvxj2I?-'
    's!y{K1;c#51OuzttwPJT==A$a~x5?r8r=xn5XWx?MQ&pSk7q5_wlGvvL_StEOXA|89i+p*2KrC_W0WZGT(wMJILR!AoYGJvG1aj!'
    'Je<42u5z}?n4<5k{U>B+vr_m+gsEIg)(amph7S;F(l_WKt>IKb%D(F2Bg0QS$B|^3PvHFBHXB8vPYaYKM(aF*1xV5*eN?m)walB<'
    '&}m`YEB?V?e{u+T{h|i4Uo}k*+T@Q-+&CaAlnY|ve^{1ao?2@Umt&q%kUDvbA1!lPT4`~4_!Uw@d|g<kgs-'
    'M6d!Dmw&@+G0kRN`rL|43fh{1@Ey%uue7at@*D8;{L>v;Y^?4|-'
    'mpsGGb@u_X*ivoQoU!HIqXnO%Eyi1u*)|ymNC<JzBo~oG&b<AM1_@+w%DeSmy`LhE_R&f|MiZAujS5Hi)o_Y^c6*8^>g7|X_fPl<'
    'wNb@_$Z_%*#!!wkUIXK<dlqfWdd~3lM#S;k*OyN}zC67HnN`>i>ZTkz3C#)ijF(k<)r%-&-'
    'dIMhf&3H~KWV322*!BS2G?RE+%{^bM>4asjcHq*HiFS*)%+gCt8i;LWdT`(il{*)yM>wS3DaXGaGmK5zOVgmJ7rw=c(7NqYDO?D)'
    'gVS`J5|Z9Esu{UCN!v~F&K!R*O2D|vMnIHy%z+di&Mdhud2P;j=X#6h(Y7~YTeyxG6Q6=(w{wwt=O&Ww&5j}*=%^p2E!C_9I3sc4'
    ';ORmC;JUZy%%I4r>7mYlF+WL<X}bLLy~%iYbg%cDLY8f5)Jv4kv{1EH3R3u&{RLvQnkH{Xj{n|)^}QSwD-(sklx*b^gGC-'
    '(hH5rDyCfXZolL>XyDqVwNrMG@{`(5Oh(m6brlFU1#`W0Ef(bZNW^S=N(31E{q+B8@oeV'
))
SOURCE_MANIFEST = b'704dfaca444e3282bc307b3fd8a99a4cb2919ec6f815a56f5524f0c49f05e4d2  active.tle\nc31969f844bb3286c77cb979033c0db4d3c25ba6556ac06505aedf7a67bd562c  catalog.tle\n5b81ea594e71f39ea286d8a84571b79674b3c6695d102984feffb97aa44f3e3e  classfd.tle\n3abebf940da9bd35f347f590e562866f8b6bdba0aa8e2fdc4b37f70e4c79ab60  cosmos-1408-debris.tle\n4848ccb9b3ab51a4cbd541ce9a11812346ca32743cf1e2d5bf463f1251f0b7ed  cosmos-2251-debris.tle\n2508394a28371e6626be874c41f4d5b66ab86315456ab02102868e5b4836688f  fengyun-1c-debris.tle\n00a5f4c8c0322e74a689fecea28f7b1833e27d612e1ce9ea6a14c463f846c682  galileo.tle\n56ad12480aec7b723861149f826f8568431229b34eb7a6f861616264e3fc9c41  geo.tle\n01edb434054d2cbaa96b93284110fb327de2ce5eb88e09a2d1aeffb26a6c1436  glo-ops.tle\nd619cec6bda89074210a80225ab2a817673b0c48a65b9677e6a473494aeaaa38  gps-ops.tle\n31fd4506c75093ce8369fa27834a2cfaadb717d098ef349491b8be672bb05fa7  iridium-33-debris.tle\n8347bdb48e8a59db2e12555e1997ee9c45723b1a871a32882745cbab02710673  iridium-NEXT.tle\nde7d388b26c88a62f14ffa6d060e6d4fe31de9b26788e68f39f12457cef1417d  last-30-days.tle\ndfdf367dbaaa44904e144b2e18a01cf72331e579d3db34aad5d337e47b413935  oneweb.tle\n471d9077c183dc2bb089f35df08fe8aa8d1b36d6ed3d9f4fbf7dcc877c3af95b  planet.tle\nd03c6a4e730c441acf706c00b95b2bf1584a8fb4f1aadec886159c66236b3299  satcat.csv\nc768d86c3678ad211fc7cda53f08fdd58cf23e41e97d04a55070a608be5380a9  science.tle\n2f52f9fc0006d28cede581817aaa58f94a54bcf896e15371390da5ac31d3f297  starlink.tle\n4491db7522f04d496b87c9c1605f4a83b1c6c1d9ab8fdec2b179db54f5282bd9  stations.tle\n4249157e7c9a0f3fe559d247fc20c2f806e2430cf7d7fed56c5950a5458c0d9f  updated.txt\n63c4c833d967c26c2b3d403de42c234ff6b920969639642a3bedce15225406e2  visual.tle\n'
AS_OF = datetime(2026, 10, 25, 8, 0, tzinfo=timezone.utc)
PROFILE = "visual_satellite_pilot.v1"
NATIVE_BASELINE = Path(__file__).resolve().parents[2] / "frontend/public/oras-sky-engine/skydata/tle_satellite.jsonl.gz"


def pilot():
    return importlib.import_module("scripts.skydata.build_visual_satellite_pilot")


@pytest.fixture
def sources(tmp_path):
    raw = tmp_path / "visual.tle"
    sums = tmp_path / "SHA256SUMS"
    raw.write_bytes(SOURCE_BYTES)
    sums.write_bytes(SOURCE_MANIFEST)
    return raw, sums


def build(sources, output, **kwargs):
    raw, sums = sources
    return pilot().build_visual_release(
        input_path=raw, source_manifest_path=sums, output_dir=output,
        native_baseline_path=kwargs.pop("native_baseline_path", NATIVE_BASELINE),
        release_version="2026.10.25.visual.1", acquired_at=kwargs.pop("acquired_at", AS_OF),
        **kwargs,
    )


def mount(monkeypatch, release, *, enabled=True):
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(release / "tle_satellite.jsonl.gz"))
    monkeypatch.setenv("ORAS_SATELLITE_TLE_MANIFEST_PATH", str(release / "manifest.json"))
    monkeypatch.delenv("ORAS_SATELLITE_MINIMUM_COUNT", raising=False)
    if enabled:
        monkeypatch.setenv("ORAS_SATELLITE_RELEASE_PROFILE", PROFILE)
    else:
        monkeypatch.delenv("ORAS_SATELLITE_RELEASE_PROFILE", raising=False)


def rewrite_manifest(release, manifest):
    (release / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")


def test_build_preserves_real_elements_and_declares_limited_mirror_provenance(sources, tmp_path):
    release = tmp_path / "release"
    manifest = build(sources, release)
    records = _read_nested_records(release / "tle_satellite.jsonl.gz")
    assert manifest["source_profile"] == PROFILE
    assert manifest["record_count"] == 155
    assert manifest["coverage"] == {
        "kind": "visual_subset",
        "description": "Limited visual-satellite pilot; 155 objects, not the full catalog.",
        "record_count": 155, "full_catalog": False,
    }
    assert manifest["required_norad"] == {"20580": True, "25544": True, "48274": True}
    assert manifest["source_key"] == "celestrak_visual_gp_mirror_pilot"
    assert manifest["source_url"] == "https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle"
    assert manifest["transport"]["revision"] == "38a142645e7814b538daaf5868b814550e1f0dda"
    assert manifest["transport"]["sha256"] == "63c4c833d967c26c2b3d403de42c234ff6b920969639642a3bedce15225406e2"
    assert manifest["transport"]["mirror_fetch_at"] == "2026-10-25T04:50:13.0828324Z"
    assert manifest["acquired_at"] == "2026-10-25T08:00:00Z"
    assert manifest["authentication"]["whole_file_first_party_authenticated"] is False
    assert manifest["six_digit_catalog_support"] is False
    assert manifest["rollback"]["sha256"] == "431592eb5ec6db56d79c26792853f3fafe36ddf76c98834d9ddb36ddc0846436"
    source_lines = SOURCE_BYTES.decode().splitlines()
    assert {tuple(r["model_data"]["tle"]) for r in records} == {
        tuple(source_lines[i+1:i+3]) for i in range(0, len(source_lines), 3)
    }
    assert all(r["provenance"]["source_key"] == "celestrak_visual_gp_mirror_pilot" for r in records)
    by_id = {str(int(r["model_data"]["source_id"])): r for r in records}
    assert by_id["25544"]["model_data"]["mag"] == -1.3
    assert by_id["19120"]["model_data"]["mag"] == 2.7
    assert by_id["12904"]["model_data"]["mag"] == 4.2
    assert by_id["694"]["model_data"]["mag"] == 2.7
    assert "mag" not in by_id["69591"]["model_data"]
    assert manifest["photometry"]["matched_record_count"] == 133
    assert manifest["photometry"]["native_default_record_count"] == 22
    assert manifest["photometry"]["live_brightness_claim"] is False
    assert (release / "visual.tle").read_bytes() == SOURCE_BYTES
    assert (release / "SHA256SUMS").read_bytes() == SOURCE_MANIFEST
    first = (release / "tle_satellite.jsonl.gz").read_bytes()
    assert build(sources, release) == manifest
    assert (release / "tle_satellite.jsonl.gz").read_bytes() == first
    assert pilot().read_validated_visual_release(release)[0] == manifest


@pytest.mark.parametrize("target", ["source", "manifest"])
def test_builder_rejects_bytes_that_do_not_match_published_pins(sources, tmp_path, target):
    path = sources[0 if target == "source" else 1]
    path.write_bytes(path.read_bytes() + b"tampered")
    with pytest.raises(ValueError, match="checksum"):
        build(sources, tmp_path / "release")
    assert not (tmp_path / "release").exists()


def test_builder_rejects_moving_or_wrong_revision(sources, tmp_path):
    with pytest.raises(ValueError, match="revision"):
        build(sources, tmp_path / "release", source_revision="main")


def test_builder_rejects_original_epochs_aged_beyond_existing_window(sources, tmp_path):
    with pytest.raises(ValueError, match="fresh"):
        build(sources, tmp_path / "release", acquired_at=datetime(2026, 11, 10, tzinfo=timezone.utc))


@pytest.mark.parametrize("change", ["checksum", "count", "required_id", "identity", "epoch", "photometry", "provenance"])
def test_validator_rejects_tampered_feed_even_with_updated_feed_hash(sources, tmp_path, change):
    release = tmp_path / "release"
    manifest = build(sources, release)
    records = _read_nested_records(release / "tle_satellite.jsonl.gz")
    if change == "checksum":
        line = records[0]["model_data"]["tle"][0]
        records[0]["model_data"]["tle"][0] = line[:-1] + str((int(line[-1]) + 1) % 10)
    elif change == "count":
        records.pop()
        manifest["record_count"] -= 1
    elif change == "required_id":
        records = [r for r in records if r["model_data"]["source_id"] != "48274"]
        manifest["record_count"] -= 1
        manifest["required_norad"]["48274"] = False
    elif change == "identity":
        records[0]["model_data"]["source_id"] = "99999"
    elif change == "epoch":
        records[0]["model_data"]["tle"][0] = records[0]["model_data"]["tle"][0].replace("26297", "26154")
    elif change == "photometry":
        records[0]["model_data"]["mag"] = -20
    else:
        records[0]["provenance"]["source_key"] = "celestrak_active_gp"
    payload = _nested_gzip_jsonl(records)
    (release / "tle_satellite.jsonl.gz").write_bytes(payload)
    manifest.update(sha256=hashlib.sha256(payload).hexdigest(), byte_size=len(payload))
    rewrite_manifest(release, manifest)
    with pytest.raises(ValueError):
        pilot().read_validated_visual_release(release)


@pytest.mark.parametrize("field,value", [
    ("source_profile", "full_catalog"), ("record_count", 1000),
    ("source_key", "celestrak_active_gp"), ("six_digit_catalog_support", True),
    ("acquired_at", "2026-11-10T00:00:00Z"),
    ("acquired_at", "2026-10-25T08:00:00"),
    ("coverage", {"kind": "full", "full_catalog": True}),
    ("required_norad", {}),
])
def test_validator_rejects_false_manifest_claims(sources, tmp_path, field, value):
    release = tmp_path / "release"
    manifest = build(sources, release)
    manifest[field] = value
    rewrite_manifest(release, manifest)
    with pytest.raises(ValueError):
        pilot().read_validated_visual_release(release)


def test_full_catalog_minimum_still_rejects_155_records(sources, tmp_path):
    with pytest.raises(ValueError, match="below minimum 1000"):
        build_release(input_path=sources[0], output_dir=tmp_path / "full",
                      release_version="full", acquired_at=AS_OF,
                      minimum_count=DEFAULT_MINIMUM_COUNT, required_norad=("25544", "20580"))
    release = tmp_path / "pilot"
    build(sources, release)
    with pytest.raises(ValueError, match="minimum"):
        read_validated_release(release, minimum_count=1000)


def test_backend_requires_explicit_profile_and_binds_snapshot_cache_to_configuration(sources, tmp_path, monkeypatch):
    release = tmp_path / "release"
    build(sources, release)
    mount(monkeypatch, release, enabled=False)
    assert build_satellite_feed_status(time="2026-10-25T08:00:00Z")["data"]["release_validated"] is False
    monkeypatch.setenv("ORAS_SATELLITE_RELEASE_PROFILE", PROFILE)
    admitted = build_satellite_feed_status(time="2026-10-25T08:00:00Z")["data"]
    assert admitted["status"] == "ready"
    assert admitted["fresh_record_count"] == 155
    assert admitted["source_profile"] == PROFILE
    assert admitted["coverage"]["full_catalog"] is False
    monkeypatch.delenv("ORAS_SATELLITE_RELEASE_PROFILE")
    assert build_satellite_feed_status(time="2026-10-25T08:00:00Z")["data"]["release_validated"] is False
    # An existing fixture minimum override alone cannot opt into a pilot profile.
    monkeypatch.setenv("ORAS_SATELLITE_MINIMUM_COUNT", "1")
    assert build_satellite_feed_status(time="2026-10-25T08:00:00Z")["data"]["release_validated"] is False


def test_backend_ages_valid_profile_without_relabeling_original_epochs(sources, tmp_path, monkeypatch):
    release = tmp_path / "release"
    build(sources, release)
    mount(monkeypatch, release)
    data = build_satellite_feed_status(time="2026-11-10T08:00:00Z")["data"]
    assert data["release_validated"] is True
    assert data["status"] == "degraded"
    assert data["stale_record_count"] == 155
    assert data["fresh_record_count"] == 0
    assert data["epoch_min"].startswith("2026-10-20")


def test_backend_revalidates_source_artifact_changes(sources, tmp_path, monkeypatch):
    release = tmp_path / "release"
    build(sources, release)
    mount(monkeypatch, release)
    assert build_satellite_feed_status(time="2026-10-25T08:00:00Z")["data"]["status"] == "ready"
    (release / "visual.tle").write_bytes(SOURCE_BYTES + b"tampered")
    assert build_satellite_feed_status(time="2026-10-25T08:00:00Z")["data"]["release_validated"] is False


@pytest.mark.parametrize("bad_manifest", [[], None, {"transport": None}, {"transport": []}])
def test_backend_degrades_for_malformed_pilot_manifest_shapes(sources, tmp_path, monkeypatch, bad_manifest):
    release = tmp_path / "release"
    build(sources, release)
    mount(monkeypatch, release)
    rewrite_manifest(release, bad_manifest)
    data = build_satellite_feed_status(time="2026-10-25T08:00:00Z")["data"]
    assert data["status"] == "degraded"
    assert data["release_validated"] is False
    assert "validation failed" in data["reason"].lower()


@pytest.mark.parametrize("filename", ["visual.tle", "SHA256SUMS"])
def test_backend_revalidates_missing_or_changed_source_artifacts(sources, tmp_path, monkeypatch, filename):
    release = tmp_path / "release"
    build(sources, release)
    mount(monkeypatch, release)
    assert build_satellite_feed_status(time="2026-10-25T08:00:00Z")["data"]["status"] == "ready"
    (release / filename).unlink()
    data = build_satellite_feed_status(time="2026-10-25T08:00:00Z")["data"]
    assert data["release_validated"] is False
    assert data["status"] == "degraded"


def test_backend_pilot_cannot_use_alternate_feed_or_split_manifest(sources, tmp_path, monkeypatch):
    release = tmp_path / "release"
    build(sources, release)
    mount(monkeypatch, release)
    alternate = release / "alternate.jsonl.gz"
    alternate.write_bytes((release / "tle_satellite.jsonl.gz").read_bytes())
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(alternate))
    assert "canonical" in build_satellite_feed_status(time="2026-10-25T08:00:00Z")["data"]["reason"]
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(release / "tle_satellite.jsonl.gz"))
    monkeypatch.setenv("ORAS_SATELLITE_TLE_MANIFEST_PATH", str(tmp_path / "manifest.json"))
    (tmp_path / "manifest.json").write_bytes((release / "manifest.json").read_bytes())
    assert "same release directory" in build_satellite_feed_status(time="2026-10-25T08:00:00Z")["data"]["reason"]


def test_backend_rejects_unknown_profile_configuration(sources, tmp_path, monkeypatch):
    release = tmp_path / "release"
    build(sources, release)
    mount(monkeypatch, release)
    monkeypatch.setenv("ORAS_SATELLITE_RELEASE_PROFILE", "visual_satellite_pilot.v2")
    data = build_satellite_feed_status(time="2026-10-25T08:00:00Z")["data"]
    assert data["release_validated"] is False
    assert "unsupported" in data["reason"]



def test_builder_rejects_modified_native_photometry_baseline(sources, tmp_path):
    changed = tmp_path / "native.jsonl.gz"
    changed.write_bytes(NATIVE_BASELINE.read_bytes() + b"tampered")
    with pytest.raises(ValueError, match="baseline.*checksum"):
        build(sources, tmp_path / "release", native_baseline_path=changed)


def test_photometry_requires_both_canonical_identity_and_designator():
    records = [
        {"model_data": {"source_id": "00694", "tle": ["1 00694U 63047A   "]}},
        {"model_data": {"source_id": "25544", "tle": ["1 25544U 98067A   "]}},
        {"model_data": {"source_id": "69591", "tle": ["1 69591U 26139C   "]}},
    ]
    baseline = [
        {"model_data": {"norad_number": 694, "tle": ["1 00694U 63047A   "], "mag": 2.7}},
        {"model_data": {"norad_number": 25544, "tle": ["1 25544U 00000A   "], "mag": -1.3}},
    ]
    before_tles = [r["model_data"]["tle"][:] for r in records]
    counts = pilot()._retain_native_photometry(records, baseline)
    assert records[0]["model_data"]["mag"] == 2.7
    assert "mag" not in records[1]["model_data"]  # ID matches, designator differs.
    assert "mag" not in records[2]["model_data"]  # No baseline magnitude.
    assert [r["model_data"]["tle"] for r in records] == before_tles
    assert counts == {"matched_record_count": 1, "native_default_record_count": 2}


def test_backend_revalidates_changed_native_photometry_baseline(sources, tmp_path, monkeypatch):
    release = tmp_path / "release"
    build(sources, release)
    mount(monkeypatch, release)
    assert build_satellite_feed_status(time="2026-10-25T08:00:00Z")["data"]["status"] == "ready"
    (release / "baseline-native-feed.jsonl.gz").write_bytes(b"tampered")
    data = build_satellite_feed_status(time="2026-10-25T08:00:00Z")["data"]
    assert data["status"] == "degraded"
    assert data["release_validated"] is False


def test_public_release_artifacts_are_readable_by_backend_and_nginx_workers(sources, tmp_path):
    release = tmp_path / "release"
    manifest = build(sources, release)
    for filename in ("visual.tle", "SHA256SUMS", "baseline-native-feed.jsonl.gz", "tle_satellite.jsonl.gz", "manifest.json"):
        path = release / filename
        assert path.stat().st_mode & 0o777 == 0o644, f"{filename} must be readable by preview service users"
    assert hashlib.sha256((release / "visual.tle").read_bytes()).hexdigest() == "63c4c833d967c26c2b3d403de42c234ff6b920969639642a3bedce15225406e2"
    assert hashlib.sha256((release / "baseline-native-feed.jsonl.gz").read_bytes()).hexdigest() == "431592eb5ec6db56d79c26792853f3fafe36ddf76c98834d9ddb36ddc0846436"
    assert hashlib.sha256((release / "tle_satellite.jsonl.gz").read_bytes()).hexdigest() == manifest["sha256"]


def test_pilot_canonical_norad_alias_resolves_zero_padded_source_without_changing_tle(sources, tmp_path):
    release = tmp_path / "release"
    build(sources, release)
    records = _read_nested_records(release / "tle_satellite.jsonl.gz")
    atlas = next(record for record in records if record["model_data"]["norad_number"] == 694)
    assert atlas["model_data"]["source_id"] == "694"
    assert "NORAD 694" in atlas["names"]
    assert "NORAD 00694" not in atlas["names"]
    assert "NAME ATLAS CENTAUR 2" in atlas["names"]
    assert "COSPAR 1963-047A" in atlas["names"]
    lines = SOURCE_BYTES.decode("ascii").splitlines()
    assert atlas["model_data"]["tle"] == lines[1:3]
    assert atlas["model_data"]["tle"][0].startswith("1 00694U ")
