// once everything is loaded, we run our Three.js stuff.

$(function () {
  var stats = initStats();

  // create a scene, that will hold all our elements such as objects, cameras and lights.
  var scene = new THREE.Scene();

  // create a camera, which defines where we're looking at.
  var camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  // create a render and set the size
  var webGLRenderer = new THREE.WebGLRenderer();
  webGLRenderer.setClearColor(new THREE.Color(0xeeeeee));
  webGLRenderer.setSize(window.innerWidth, window.innerHeight);
  webGLRenderer.shadowMapEnabled = true;

  // position and point the camera to the center of the scene
  camera.position.x = -30;
  camera.position.y = 40;
  camera.position.z = 50;
  camera.lookAt(new THREE.Vector3(10, 0, 0));

  // add the output of the renderer to the html element
  $("#WebGL-output").append(webGLRenderer.domElement);

  var cameraControls = new THREE.TrackballControls(
    camera,
    webGLRenderer.domElement
  );
  // cameraControls.target.set(0, 0, 0);
  var clock = new THREE.Clock();

  const R1 = 20;
  const R2 = 10;
  const H = 30;

  // the points group
  var spGroup;
  // the mesh
  var hullMesh;
  var line;

  generatePoints();

  // setup the control gui
  var controls = new (function () {
    // we need the first child, since it's a multimaterial

    this.redraw = function () {
      scene.remove(spGroup);
      scene.remove(hullMesh);
      scene.remove(line);
      generatePoints();
    };
  })();

  var gui = new dat.GUI();
  gui.add(controls, "redraw");

  render();

  function generatePoints() {
    // add 100 random spheres
    var points = [];

    // for (var i = 0; i < 300; i++) {
    //   var phi = 2 * Math.PI * Math.random();
    //   var v = Math.random();
    //   var randomX = ((1 - v) * R1 + v * R2) * Math.sin(phi);
    //   var randomY = (H / 2) * (2 * v - 1);
    //   var randomZ = ((1 - v) * R1 + v * R2) * Math.cos(phi);
    //   points.push(new THREE.Vector3(randomX, randomY, randomZ));
    // }

    // for (var i = 0; i < 300; i++) {
    //   var phi = 2 * Math.PI * Math.random();
    //   var v = Math.random();
    //   var randomX = R1 * v * Math.sin(phi);
    //   var randomZ = R1 * v * Math.cos(phi);
    //   points.push(new THREE.Vector3(randomX, -H / 2, randomZ));
    // }

    // for (var i = 0; i < 300; i++) {
    //   var phi = Math.random();
    //   var v = Math.random();
    //   var randomX = R2 * v * Math.sin(2 * Math.PI * phi);
    //   var randomZ = R2 * v * Math.cos(2 * Math.PI * phi);
    //   points.push(new THREE.Vector3(randomX, H / 2, randomZ));
    // }

    m = (R1 - R2) ** 2 / H ** 2;
    d = ((H / 2) * (R1 + R2)) / (R1 - R2);
    maximumVal = Math.max(R1, R2, H);

    for (var i = 0; i < 1000; i++) {
      x = THREE.Math.randFloat(-maximumVal, maximumVal);
      y = THREE.Math.randFloat(-H, H);
      z = THREE.Math.randFloat(-maximumVal, maximumVal);

      if (x ** 2 + z ** 2 <= m * (y - d) ** 2) {
        points.push(new THREE.Vector3(x, y, z));
      }
    }

    spGroup = new THREE.Group();
    points.forEach(function (point) {
      var spGeom = new THREE.SphereGeometry(0.2);
      var material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(Math.random(), Math.random(), Math.random()),
      });
      var spMesh = new THREE.Mesh(spGeom, material);
      spMesh.position.set(point.x, point.y, point.z);
      spGroup.add(spMesh);
    });
    scene.add(spGroup);

    // add the points as a group to the scene
    // use the same points to create a convexgeometry
    var hullGeometry = new THREE.ConvexGeometry(points);
    createMesh(hullGeometry);
  }

  function createMesh(geometry) {
    // assign two materials

    var texture = new THREE.TextureLoader().load("textures/checker-best.jpg");

    let material = new THREE.MeshBasicMaterial({
      map: texture,
    });

    geometry.computeBoundingBox();

    geometry.computeFaceNormals();
    cylinderUnwrapUVs(geometry);
    material.map.wrapS = THREE.RepeatWrapping;
    material.map.wrapT = THREE.RepeatWrapping;
    material.map.repeat.set(3, 3);
    hullMesh = new THREE.Mesh(geometry, material);
    scene.add(hullMesh);
  }
  function cylinderUnwrapUVs(geometry) {
    const allPoints = [];
    for (var i = 0; i < geometry.faces.length; i++) {
      var faceUVs = geometry.faceVertexUvs[0][i];
      var va = geometry.vertices[geometry.faces[i].a];
      var vb = geometry.vertices[geometry.faces[i].b];
      var vc = geometry.vertices[geometry.faces[i].c];

      allPoints.push(va);
      allPoints.push(vb);
      allPoints.push(vc);

      var Au1, Au2, Au3;
      var Av1, Av2, Av3;

      var n = new THREE.Vector3().copy(va);

      Au1 = Math.atan2(n.x, n.z) / (2 * Math.PI);
      Av1 = n.y / H + 0.5;

      n = new THREE.Vector3().copy(vb);

      Au2 = Math.atan2(n.x, n.z) / (2 * Math.PI);
      Av2 = n.y / H + 0.5;

      n = new THREE.Vector3().copy(vc);

      Au3 = Math.atan2(n.x, n.z) / (2 * Math.PI);
      Av3 = n.y / H + 0.5;

      const distTolerance = 0.8;
      one = 1;
      if (dist(Au1, Au2) >= distTolerance || dist(Au1, Au3) >= distTolerance) {
        if (
          dist(Au1, Au2) >= distTolerance &&
          dist(Au1, Au3) >= distTolerance
        ) {
          if (Au1 > 0) {
            one = -1;
          }
          Au1 = Au1 + one;
        } else if (dist(Au1, Au2) >= distTolerance) {
          if (Au2 > 0) {
            one = -1;
          }
          Au2 = Au2 + one;
        } else {
          // dist(Au1, Au3) > 0.2
          if (Au3 > 0) {
            one = -1;
          }
          Au3 = Au3 + one;
        }
      }
      faceUVs[0].set(Au1, Av1);
      faceUVs[1].set(Au2, Av2);
      faceUVs[2].set(Au3, Av3);

      console.log([Av1, Av2, Av3]);
    }
    geometry.elementsNeedUpdate = geometry.verticesNeedUpdate = true;
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x0000ff,
    });
    const lineGeometry = new THREE.Geometry().setFromPoints(allPoints);

    line = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(line);
  }

  function dist(Au1, Au2) {
    return Math.abs(Au2 - Au1);
  }

  function render() {
    // if (hullMesh) {
    //   line.rotation.y = step;
    //   line.geometry.verticesNeedUpdate = true;
    //   spGroup.rotation.y = step;
    //   hullMesh.rotation.y = step += 0.01;
    // }

    var delta = clock.getDelta();
    requestAnimationFrame(render);

    cameraControls.update(delta);

    // render using requestAnimationFrame
    webGLRenderer.render(scene, camera);
    stats.update();
  }

  function initStats() {
    var stats = new Stats();
    stats.setMode(0); // 0: fps, 1: ms

    // Align top-left
    stats.domElement.style.position = "absolute";
    stats.domElement.style.left = "0px";
    stats.domElement.style.top = "0px";

    $("#Stats-output").append(stats.domElement);

    return stats;
  }
});
