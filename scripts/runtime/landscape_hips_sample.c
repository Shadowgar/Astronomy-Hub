/* Original packaging utility. Uses pinned SWE HEALPix geometry unchanged.
 * Resamples illustration pixels only; never creates scientific horizon data. */
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include "utils/vec.h"
extern void healpix_get_mat3(int nside,int pix,double out[3][3]);
extern void healpix_xy2vec(const double xy[2],double out[3]);
int main(int argc,char **argv) {
 if(argc!=6)return 2;
 int w=atoi(argv[1]),h=atoi(argv[2]),size=atoi(argv[3]),pix=atoi(argv[4]);
 if(w<2||h<2||size<2||pix<0||pix>=12)return 2;
 unsigned char *image=malloc((size_t)w*h*4);if(!image)return 2;
 if(fread(image,4,(size_t)w*h,stdin)!=(size_t)w*h)return 2;
 FILE *out=fopen(argv[5],"wb");if(!out)return 2;
 double mat[3][3];healpix_get_mat3(1,pix,mat);
 for(int y=0;y<size;y++)for(int x=0;x<size;x++) {
  /* Native HiPS render_visitor swaps texture U/V, with unflipped image rows. */
  double uv[3]={(y+.5)/size,(x+.5)/size,1},v[3],p[3];
  mat3_mul_vec3(mat,uv,p);healpix_xy2vec(p,v);
  double az=atan2(v[1],v[0]);if(az<0)az+=2*M_PI;
  double sx=az/(2*M_PI)*w-.5,sy=(.5-asin(v[2])/M_PI)*h-.5;
  int ix=(int)floor(sx),iy=(int)floor(sy);double fx=sx-ix,fy=sy-iy;
  unsigned char rgba[4];double alpha=0,color[3]={0,0,0};
  for(int dy=0;dy<2;dy++)for(int dx=0;dx<2;dx++){
   int xx=((ix+dx)%w+w)%w,yy=iy+dy;if(yy<0)yy=0;if(yy>=h)yy=h-1;
   const unsigned char *pixel=image+(yy*w+xx)*4;
   double coverage=(pixel[3]>=250?255:pixel[3])/255.0;
   double weight=(dx?fx:1-fx)*(dy?fy:1-fy);alpha+=coverage*weight;
   for(int c=0;c<3;c++)color[c]+=pixel[c]*coverage*weight;
  }
  for(int c=0;c<3;c++)rgba[c]=alpha>0?(unsigned char)lround(color[c]/alpha):0;
  rgba[3]=(unsigned char)lround(alpha*255);
  if(fwrite(rgba,1,4,out)!=4)return 2;
 }
 fclose(out);free(image);return 0;
}
