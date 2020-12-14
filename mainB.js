// once everything is loaded, we run our Three.js stuff.

$(function () {
  var stats = initStats();

  // create a scene, that will hold all our elements such as objects, cameras and lights.
  var scene = new THREE.Scene();

  // create a render and set the size
  var webGLRenderer = new THREE.WebGLRenderer();
  webGLRenderer.setClearColor(new THREE.Color(0xeeeeee));
  webGLRenderer.setSize(window.innerWidth, window.innerHeight);
  webGLRenderer.shadowMapEnabled = true;

  const PLANE_SIZE = 300;

  var planeGeometry = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE);
  var texture = new THREE.TextureLoader().load("textures/checker-best.jpg");
  var planeMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    map: texture,
  });

  planeGeometry.computeBoundingBox();
  planeGeometry.computeFaceNormals();
  planeMaterial.map.wrapS = THREE.RepeatWrapping;
  planeMaterial.map.wrapT = THREE.RepeatWrapping;
  planeMaterial.map.repeat.set(3, 3);

  var plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.receiveShadow = true;
  // rotate and position the plane
  plane.rotation.x = -0.5 * Math.PI;
  plane.position.x = -10;
  plane.position.y = 0;
  plane.position.z = -10;
  scene.add(plane);

  var spotLight = new THREE.SpotLight();
  spotLight.position.set(0, 250, 0);
  spotLight.castShadow = true;
  scene.add(spotLight);

  // create a camera, which defines where we're looking at.
  var firstCamera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  firstCamera.position.x = -30;
  firstCamera.position.y = 40;
  firstCamera.position.z = 50;

  firstCamera.lookAt(plane.position);

  var secondCamera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  secondCamera.position.x = PLANE_SIZE;
  secondCamera.position.y = 50;
  secondCamera.position.z = 0;

  var initialPos = new THREE.Vector3(
    secondCamera.position.x,
    secondCamera.position.y,
    secondCamera.position.z
  );

  var thirdCamera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  thirdCamera.position.x = 0;
  thirdCamera.position.y = 200;
  thirdCamera.position.z = 0;

  var camera = firstCamera;

  var shouldMove = true;
  var step = 0;

  // add the output of the renderer to the html element
  $("#WebGL-output").append(webGLRenderer.domElement);

  var cameraControls = new THREE.TrackballControls(
    camera,
    webGLRenderer.domElement
  );
  // cameraControls.target.set(0, 0, 0);
  var clock = new THREE.Clock();

  // the mesh
  var figure = createFigure();
  figure.position.x = 0;
  figure.position.y = 0;
  figure.position.z = 0;
  var box = new THREE.Box3().setFromObject(figure);

  var figureMiddlePoint = new THREE.Vector3(
    figure.position.x,
    figure.position.y + box.getSize().y * 0.5,
    figure.position.z
  );

  scene.add(figure);

  secondCamera.lookAt(figure.position);

  var height =
    Math.tan(secondCamera.fov * (Math.PI / 180) * 0.5) *
    secondCamera.position.distanceTo(figureMiddlePoint);

  var secondHelper = new THREE.CameraHelper(secondCamera);
  scene.add(secondHelper);
  var thirdHelper = new THREE.CameraHelper(thirdCamera);
  scene.add(thirdHelper);

  var secondCam;
  var thirdCam;

  var loader = new THREE.OBJLoader();
  loader.load("models/camera.obj", function (geo) {
    mesh = geo;
    mesh.position.set(
      secondCamera.position.x,
      secondCamera.position.y,
      secondCamera.position.z
    );
    mesh.rotation.set(
      -secondCamera.rotation.x,
      -secondCamera.rotation.y,
      secondCamera.rotation.z
    );
    scene.add(mesh);
    secondCam = mesh;
  });
  loader.load("models/camera.obj", function (geo) {
    mesh = geo;
    mesh.position.set(
      thirdCamera.position.x,
      thirdCamera.position.y,
      thirdCamera.position.z
    );
    mesh.rotation.set(
      -thirdCamera.rotation.x,
      thirdCamera.rotation.y,
      thirdCamera.rotation.z
    );
    thirdCam = mesh;
    scene.add(mesh);
  });

  // setup the control gui
  var controls = new (function () {
    // we need the first child, since it's a multimaterial
    this.FOV = 45;
    this.FirstCam = function () {
      camera = firstCamera;
    };
    this.DollyZoom = 45;
    this.SecondCam = function () {
      camera = secondCamera;
      figure.position.x = figure.position.z = 0;
      step = 0;
      shouldMove = false;
      secondCamera.lookAt(figureMiddlePoint);
      secondCam.lookAt(figureMiddlePoint);
    };
    this.ThirdCam = function () {
      camera = thirdCamera;
      shouldMove = true;
    };
  })();

  var gui = new dat.GUI();
  gui.add(controls, "FOV", 10, 100).onChange(() => {
    firstCamera.fov = controls.FOV;
    firstCamera.updateProjectionMatrix();
  });
  gui.add(controls, "FirstCam");
  gui.add(controls, "DollyZoom", -300, 215).onChange(() => {
    const lookDir = new THREE.Vector3();

    secondCamera.getWorldDirection(lookDir);
    // height = FrustumHeightAtDistance(
    //   secondCamera.position.distanceTo(figureMiddlePoint),
    //   controls.DollyZoom
    // );

    //var dist = calculateDistForDollyZoom(height + 25, controls.DollyZoom);
    lookDir.multiplyScalar(controls.DollyZoom);
    const newPos = new THREE.Vector3(initialPos.x, initialPos.y, initialPos.z);
    newPos.add(lookDir);
    secondCamera.position.set(newPos.x, newPos.y, newPos.z);
    if (secondCam) {
      secondCam.position.set(newPos.x, newPos.y, newPos.z);
    }
    var eyedir = new THREE.Vector3();
    eyedir.subVectors(secondCamera.position, figureMiddlePoint);
    secondCamera.fov =
      (180 / Math.PI) * 2 * Math.atan(height / eyedir.length()); //controls.DollyZoom;
    secondCamera.near = eyedir.length() / 100;
    secondCamera.far = eyedir.length() + 10000;
    secondCamera.updateProjectionMatrix();
    secondHelper.update();
  });
  gui.add(controls, "SecondCam");
  gui.add(controls, "ThirdCam");

  render();

  function FrustumHeightAtDistance(distance, fov) {
    return distance * Math.tan(THREE.MathUtils.degToRad(fov * 0.5));
  }

  function calculateDistForDollyZoom(width, fov) {
    return width / (2 * Math.tan(THREE.MathUtils.degToRad(fov * 0.5)));
  }

  function createFigure() {
    var points = [];
    points.push(new THREE.Vector2(0, 0));
    points.push(new THREE.Vector2(12.5, 0));
    points.push(new THREE.Vector2(12.5, 2));
    points.push(new THREE.Vector2(10, 3));
    points.push(new THREE.Vector2(10.5, 4));
    points.push(new THREE.Vector2(10, 5));
    points.push(new THREE.Vector2(3, 27));
    points.push(new THREE.Vector2(7.5, 30));
    points.push(new THREE.Vector2(3, 30));
    points.push(new THREE.Vector2(4, 35));
    points.push(new THREE.Vector2(6, 40));
    points.push(new THREE.Vector2(4, 40));
    points.push(new THREE.Vector2(1.25, 42));
    points.push(new THREE.Vector2(2, 43.5));
    points.push(new THREE.Vector2(0, 55));

    return createLatheMesh(points);
  }
  function createLatheMesh(points) {
    var lathe = new THREE.LatheGeometry(points, 128, 0, 2 * Math.PI);
    var latheMaterial = new THREE.MeshPhongMaterial({
      color: "white",
      combine: THREE.MixOperation,
      reflectivity: 0.3,
      shininess: 300,
    });
    latheMaterial.side = THREE.DoubleSide;
    return new THREE.Mesh(lathe, latheMaterial);
  }

  function render() {
    var delta = clock.getDelta();
    requestAnimationFrame(render);

    const distToChangeUp = 50000;
    thirdCamera.lookAt(figure.position);
    if (thirdCam) {
      thirdCam.lookAt(figure.position);
    }
    dist = thirdCamera.position.distanceToSquared(figure.position);
    if (dist <= distToChangeUp) {
      multiplier = (40000 / distToChangeUp) * 1;
      v = (multiplier * (distToChangeUp - dist)) / 40000;
      thirdCamera.up = new THREE.Vector3(0, 1 - v, v);
      if (thirdCam) {
        thirdCam.up = new THREE.Vector3(0, 1 - v, v);
      }
    } else {
      thirdCamera.up = new THREE.Vector3(0, 1, 0);
      if (thirdCam) {
        thirdCam.up = new THREE.Vector3(0, 1, 0);
      }
    }
    cameraControls.update(delta);
    if (shouldMove) {
      step += 0.01;
      figure.position.x = figure.position.z =
        (Math.sin(step) * (PLANE_SIZE - 20)) / 2;
    }

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
