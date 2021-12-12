// World position of geometry
attribute vec2 a_position;

// UV coordinate
attribute vec2 a_texcoord;
varying vec2 v_texcoord;

// Orthographic "world" transform matrix
uniform mat4 u_matrix;

// Camera position
uniform vec2 u_camera;

void main() {

   // Set the vertex position using the ortho transform matrix
   gl_Position = u_matrix * vec4(a_position - u_camera, 0, 1.0);

   // Pass through the UV coord to the fragment shader
   v_texcoord = a_texcoord;
}