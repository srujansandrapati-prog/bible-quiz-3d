(function () {
  let scene, camera, renderer, clock;
  let waterMesh, sunLight, spotlightBeam;
  let confettiParticles = [];

  const players = {
    p1: {
      score: 0,
      targetHeight: 0,
      currentHeight: 0,
      avatarId: 'david',
      group: null,
      character: null,
      head: null,
      leftArm: null,
      rightArm: null,
      pillarGroup: null,
      discs: [],
      emote: 'idle', // 'idle' | 'celebrate' | 'sad'
      jumpTimer: 0
    },
    p2: {
      score: 0,
      targetHeight: 0,
      currentHeight: 0,
      avatarId: 'moses',
      group: null,
      character: null,
      head: null,
      leftArm: null,
      rightArm: null,
      pillarGroup: null,
      discs: [],
      emote: 'idle',
      jumpTimer: 0
    }
  };

  const AVATAR_STYLES = {
    david:  { robe: 0x3b82f6, sash: 0xfbbf24, skin: 0xfcd34d, prop: 'harp' },
    moses:  { robe: 0x991b1b, sash: 0xd97706, skin: 0xf59e0b, prop: 'staff' },
    esther: { robe: 0x9333ea, sash: 0xfde047, skin: 0xfef08a, prop: 'crown' },
    paul:   { robe: 0x059669, sash: 0xfef3c7, skin: 0xfcd34d, prop: 'scroll' },
    knight: { robe: 0x64748b, sash: 0x38bdf8, skin: 0xe2e8f0, prop: 'shield' }
  };

  function initArena3D() {
    if (document.getElementById('arena3d-canvas')) return;

    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x1e293b, 0.015);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.set(0, 7.5, 19);
    camera.lookAt(0, 3.5, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    const canvas = renderer.domElement;
    canvas.id = 'arena3d-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '1';
    canvas.style.pointerEvents = 'none';
    document.body.prepend(canvas);

    setupLights();
    buildAmphitheater();
    buildPlayerUnit('p1', -3.8);
    buildPlayerUnit('p2', 3.8);
    buildVictoryBeam();

    window.addEventListener('resize', onWindowResize);
    animate();
  }

  function setupLights() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x0284c7, 0.85);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    sunLight = new THREE.DirectionalLight(0xfffbeb, 1.2);
    sunLight.position.set(14, 28, 18);
    sunLight.castShadow = true;
    scene.add(sunLight);
  }

  function buildAmphitheater() {
    // Shimmering Water Pool
    const waterGeo = new THREE.CylinderGeometry(36, 36, 1.5, 48);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.15,
      metalness: 0.35
    });
    waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = -0.8;
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);

    // Marble Outer Ring & Columns
    const ringGeo = new THREE.TorusGeometry(18, 1.1, 16, 64);
    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const ring = new THREE.Mesh(ringGeo, marbleMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0;
    scene.add(ring);

    const colGeo = new THREE.CylinderGeometry(0.55, 0.65, 9, 16);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6, roughness: 0.3 });

    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 1.15) + (i / 9) * (Math.PI * 0.7);
      const col = new THREE.Mesh(colGeo, marbleMat);
      col.position.set(Math.cos(angle) * 17.5, 4.5, Math.sin(angle) * 17.5);
      col.castShadow = true;
      scene.add(col);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 1.6), goldMat);
      cap.position.set(col.position.x, 9.2, col.position.z);
      scene.add(cap);
    }
  }

  function buildPlayerUnit(key, xPos) {
    const p = players[key];
    p.group = new THREE.Group();
    p.group.position.set(xPos, 0, 0);
    scene.add(p.group);

    // Base Pedestal
    const baseGeo = new THREE.CylinderGeometry(1.55, 1.85, 1.2, 24);
    const baseColor = key === 'p1' ? 0x1d4ed8 : 0xb91c1c;
    const baseMat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.35 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.6;
    p.group.add(baseMesh);

    // Gold Trim Ring
    const trimGeo = new THREE.CylinderGeometry(1.62, 1.62, 0.18, 24);
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.7, roughness: 0.2 });
    const trimMesh = new THREE.Mesh(trimGeo, trimMat);
    trimMesh.position.y = 1.15;
    p.group.add(trimMesh);

    // Group that holds stacked score discs
    p.pillarGroup = new THREE.Group();
    p.pillarGroup.position.y = 1.2;
    p.group.add(p.pillarGroup);

    // Build 3D Character
    rebuildCharacterMesh(key, p.avatarId);
  }

  function rebuildCharacterMesh(key, avatarId) {
    const p = players[key];
    p.avatarId = avatarId in AVATAR_STYLES ? avatarId : 'david';
    const style = AVATAR_STYLES[p.avatarId];

    if (p.character) {
      p.group.remove(p.character);
    }

    const charGroup = new THREE.Group();

    // Robe / Torso
    const bodyGeo = new THREE.CylinderGeometry(0.42, 0.68, 1.45, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: style.robe, roughness: 0.5 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.72;
    charGroup.add(body);

    // Golden Sash
    const sashGeo = new THREE.CylinderGeometry(0.45, 0.52, 0.28, 16);
    const sashMat = new THREE.MeshStandardMaterial({ color: style.sash, metalness: 0.4 });
    const sash = new THREE.Mesh(sashGeo, sashMat);
    sash.position.y = 0.85;
    charGroup.add(sash);

    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.75;

    const headGeo = new THREE.SphereGeometry(0.42, 20, 20);
    const skinMat = new THREE.MeshStandardMaterial({ color: style.skin, roughness: 0.4 });
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headGroup.add(headMesh);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.055, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.14, 0.06, 0.38);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.14, 0.06, 0.38);
    headGroup.add(leftEye, rightEye);

    // Crown for Esther
    if (style.prop === 'crown') {
      const crownGeo = new THREE.CylinderGeometry(0.36, 0.3, 0.25, 12);
      const crownMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.y = 0.42;
      headGroup.add(crown);
    }

    charGroup.add(headGroup);
    p.head = headGroup;

    // Left & Right Arms
    const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.85, 10);
    const leftArm = new THREE.Mesh(armGeo, bodyMat);
    leftArm.position.set(-0.62, 1.05, 0);
    leftArm.rotation.z = 0.25;
    charGroup.add(leftArm);
    p.leftArm = leftArm;

    const rightArm = new THREE.Mesh(armGeo, bodyMat);
    rightArm.position.set(0.62, 1.05, 0);
    rightArm.rotation.z = -0.25;
    charGroup.add(rightArm);
    p.rightArm = rightArm;

    // Staff for Moses
    if (style.prop === 'staff') {
      const staffGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.3, 8);
      const staffMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
      const staff = new THREE.Mesh(staffGeo, staffMat);
      staff.position.set(0.35, 0.1, 0.2);
      rightArm.add(staff);
    }

    charGroup.position.y = 1.2 + p.currentHeight;
    p.character = charGroup;
    p.group.add(charGroup);
  }

  function buildVictoryBeam() {
    const beamGeo = new THREE.CylinderGeometry(2.1, 2.1, 28, 24, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide
    });
    spotlightBeam = new THREE.Mesh(beamGeo, beamMat);
    spotlightBeam.position.set(0, 14, 0);
    scene.add(spotlightBeam);
  }

  function syncPillars(key, newScore) {
    const p = players[key];
    p.score = Math.max(0, newScore);
    const desiredDiscs = Math.floor(p.score / 5);
    const discHeight = 0.22;

    while (p.discs.length < desiredDiscs) {
      const idx = p.discs.length;
      const discGeo = new THREE.CylinderGeometry(1.42, 1.48, discHeight - 0.02, 20);
      const isGold = idx % 2 === 0;
      const discMat = new THREE.MeshStandardMaterial({
        color: isGold ? 0xfbbf24 : 0xf8fafc,
        metalness: isGold ? 0.5 : 0.1,
        roughness: 0.3
      });
      const disc = new THREE.Mesh(discGeo, discMat);
      disc.position.y = idx * discHeight + discHeight / 2;
      p.pillarGroup.add(disc);
      p.discs.push(disc);
    }

    while (p.discs.length > desiredDiscs) {
      const removed = p.discs.pop();
      p.pillarGroup.remove(removed);
    }

    if (desiredDiscs * discHeight > p.targetHeight) {
      p.jumpTimer = 1.0;
    }
    p.targetHeight = desiredDiscs * discHeight;
  }

  function spawnConfetti(xPos, yPos) {
    clearConfetti();
    const colors = [0xfacc15, 0x38bdf8, 0x4ade80, 0xf472b6, 0xffffff];
    const geo = new THREE.PlaneGeometry(0.18, 0.18);
    for (let i = 0; i < 65; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        side: THREE.DoubleSide
      });
      const p = new THREE.Mesh(geo, mat);
      p.position.set(
        xPos + (Math.random() - 0.5) * 4.5,
        yPos + 4 + Math.random() * 5,
        (Math.random() - 0.5) * 3.5
      );
      p.userData = {
        vy: 1.5 + Math.random() * 2.0,
        rx: Math.random() * 4,
        ry: Math.random() * 4,
        baseY: yPos + 5
      };
      scene.add(p);
      confettiParticles.push(p);
    }
  }

  function clearConfetti() {
    confettiParticles.forEach(p => scene.remove(p));
    confettiParticles = [];
  }

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.1);
    const elapsed = clock.getElapsedTime();

    if (waterMesh) {
      waterMesh.position.y = -0.8 + Math.sin(elapsed * 2.2) * 0.08;
    }

    ['p1', 'p2'].forEach((key, idx) => {
      const p = players[key];
      if (!p.character) return;

      p.currentHeight += (p.targetHeight - p.currentHeight) * Math.min(1, dt * 8);

      let jumpOffset = 0;
      if (p.jumpTimer > 0) {
        p.jumpTimer = Math.max(0, p.jumpTimer - dt * 2.2);
        jumpOffset = Math.sin(p.jumpTimer * Math.PI) * 0.85;
      }

      p.character.position.y = 1.2 + p.currentHeight + jumpOffset;

      if (p.emote === 'celebrate') {
        p.character.position.y += Math.abs(Math.sin(elapsed * 7)) * 0.35;
        p.head.rotation.x = -0.15;
        p.head.rotation.y = Math.sin(elapsed * 4) * 0.2;
        p.leftArm.rotation.z = 2.6 + Math.sin(elapsed * 10) * 0.25;
        p.rightArm.rotation.z = -2.6 - Math.sin(elapsed * 10) * 0.25;
      } else if (p.emote === 'sad') {
        // Respectful sad posture: stays safely on pillar, bows head gently, droops shoulders
        p.head.rotation.x = 0.45;
        p.head.rotation.z = Math.sin(elapsed * 2) * 0.12;
        p.leftArm.rotation.z = 0.08;
        p.rightArm.rotation.z = -0.08;
        p.character.scale.y = 0.94 + Math.sin(elapsed * 1.5) * 0.02;
      } else {
        p.character.scale.y = 1.0;
        p.head.rotation.x = Math.sin(elapsed * 1.8 + idx) * 0.05;
        p.head.rotation.y = Math.sin(elapsed * 1.1 + idx) * 0.12;
        p.head.rotation.z = 0;
        if (p.jumpTimer > 0) {
          p.leftArm.rotation.z = 2.5;
          p.rightArm.rotation.z = -2.5;
        } else {
          p.leftArm.rotation.z = 0.25 + Math.sin(elapsed * 2 + idx) * 0.06;
          p.rightArm.rotation.z = -0.25 - Math.sin(elapsed * 2 + idx) * 0.06;
        }
      }
    });

    const maxPillar = Math.max(players.p1.currentHeight, players.p2.currentHeight);
    const targetCamY = 6.8 + maxPillar * 0.85;
    const targetCamZ = 18.5 + maxPillar * 0.95;
    camera.position.y += (targetCamY - camera.position.y) * Math.min(1, dt * 3);
    camera.position.z += (targetCamZ - camera.position.z) * Math.min(1, dt * 3);
    camera.lookAt(0, 2.8 + maxPillar * 0.75, 0);

    confettiParticles.forEach(c => {
      c.position.y -= c.userData.vy * dt;
      c.rotation.x += c.userData.rx * dt;
      c.rotation.y += c.userData.ry * dt;
      if (c.position.y < c.userData.baseY - 6) {
        c.position.y = c.userData.baseY + Math.random() * 2;
      }
    });

    renderer.render(scene, camera);
  }

  function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  window.Arena3D = {
    init: initArena3D,
    setAvatars: function (p1Avatar, p2Avatar) {
      initArena3D();
      rebuildCharacterMesh('p1', p1Avatar);
      rebuildCharacterMesh('p2', p2Avatar);
    },
    updateScores: function (p1Score, p2Score) {
      initArena3D();
      syncPillars('p1', p1Score);
      syncPillars('p2', p2Score);
    },
    showMatchResult: function (result) {
      initArena3D();
      if (result === 'p1') {
        players.p1.emote = 'celebrate';
        players.p2.emote = 'sad';
        spotlightBeam.position.x = players.p1.group.position.x;
        spotlightBeam.material.opacity = 0.22;
        spawnConfetti(players.p1.group.position.x, players.p1.currentHeight);
      } else if (result === 'p2') {
        players.p1.emote = 'sad';
        players.p2.emote = 'celebrate';
        spotlightBeam.position.x = players.p2.group.position.x;
        spotlightBeam.material.opacity = 0.22;
        spawnConfetti(players.p2.group.position.x, players.p2.currentHeight);
      } else {
        players.p1.emote = 'celebrate';
        players.p2.emote = 'celebrate';
        spotlightBeam.position.x = 0;
        spotlightBeam.material.opacity = 0.18;
        spawnConfetti(0, Math.max(players.p1.currentHeight, players.p2.currentHeight));
      }
    },
    resetMatch: function () {
      initArena3D();
      players.p1.emote = 'idle';
      players.p2.emote = 'idle';
      spotlightBeam.material.opacity = 0.0;
      clearConfetti();
      syncPillars('p1', 0);
      syncPillars('p2', 0);
    }
  };

  window.addEventListener('DOMContentLoaded', initArena3D);
})();
