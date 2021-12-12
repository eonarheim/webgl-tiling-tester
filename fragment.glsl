precision mediump float;

// UV coord
varying vec2 v_texcoord;

// Texture in the current draw
uniform sampler2D u_texture;

void main() {
   vec4 color = texture2D(u_texture, v_texcoord);

   gl_FragColor = color;
}