FROM --platform=linux/amd64 emscripten/emsdk@sha256:1e264934c11ffde8511441eaed6bdc44eaa30ec027e46d38be7ae67106aefdab

# Official base already supplies Python, make and the compiler. Add only the
# archived SCons package acquired and verified by acquire_toolchain.py.
COPY scons.deb /tmp/scons.deb
RUN echo '9c0c7be3025255466852cdc4a303b858fd4cd08f0401cf33046fb4502c25e068  /tmp/scons.deb' | sha256sum -c - \
 && dpkg -i /tmp/scons.deb \
 && rm /tmp/scons.deb

WORKDIR /app
