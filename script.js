// Import necessary libraries (e.g., THREE.js) in your HTML for this to work
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Basic lighting
const light = new THREE.AmbientLight(0x404040, 5);
scene.add(light);

// Player (represented as a cube for now)
const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
scene.add(player);
camera.position.set(0, 5, 10);

// Load textures
const textureLoader = new THREE.TextureLoader();
const grassTexture = textureLoader.load('textures/grass.png');
const dirtTexture = textureLoader.load('textures/dirt.png');
const stoneTexture = textureLoader.load('textures/stone.png');

// Parameters for chunk generation
const chunkSize = 16;
const chunkHeight = 10;
const noiseScale = 0.1; // Adjust for more or less variation
const chunks = {};

// Inventory setup
const inventory = {
  blocks: {
    grass: { texture: grassTexture, count: 0 },
    dirt: { texture: dirtTexture, count: 0 },
    stone: { texture: stoneTexture, count: 0 },
  },
  selectedBlock: 'grass', // Default selected block
};

// Function to get block texture based on height
function getBlockTexture(y) {
  if (y === 0) return dirtTexture; // Ground level
  else if (y === 1) return grassTexture; // Grass on top
  else return stoneTexture; // Below ground
}

// Create a chunk of blocks
function createChunk(x, z) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  for (let y = 0; y < chunkHeight; y++) {
    const height = Math.floor(SimplexNoise.noise2D(x * noiseScale, z * noiseScale) * chunkHeight);
    if (y <= height) {
      const material = new THREE.MeshBasicMaterial({ map: getBlockTexture(y) });
      const block = new THREE.Mesh(geometry, material);
      block.position.set(x, y, z);
      scene.add(block);
    }
  }
}

// Generate chunks around the player
function generateChunks() {
  const playerChunkX = Math.floor(player.position.x / chunkSize);
  const playerChunkZ = Math.floor(player.position.z / chunkSize);
  for (let x = playerChunkX - 1; x <= playerChunkX + 1; x++) {
    for (let z = playerChunkZ - 1; z <= playerChunkZ + 1; z++) {
      const chunkKey = `${x},${z}`;
      if (!chunks[chunkKey]) {
        createChunk(x * chunkSize, z * chunkSize);
        chunks[chunkKey] = true;
      }
    }
  }
}

// Inventory display update
function updateInventoryDisplay() {
  document.getElementById('grass-item').innerText = `Grass: ${inventory.blocks.grass.count}`;
  document.getElementById('dirt-item').innerText = `Dirt: ${inventory.blocks.dirt.count}`;
  document.getElementById('stone-item').innerText = `Stone: ${inventory.blocks.stone.count}`;
}

// Collect blocks into inventory
function collectBlock(blockType) {
  if (inventory.blocks[blockType]) {
    inventory.blocks[blockType].count++;
    updateInventoryDisplay(); // Update the UI
  }
}

// Check for block breaking and collecting
let breakingBlock = false;
function checkBlockBreaking() {
  if (breakingBlock) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    mouse.x = (0 * 2 - 1); // Center of the screen
    mouse.y = (0 * -2 + 1); // Center of the screen
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
      const block = intersects[0].object;
      const blockType = getBlockType(block.position.y);
      collectBlock(blockType); // Collect block into inventory
      scene.remove(block); // Break the block
    }
  }
}

// Determine block type based on height
function getBlockType(y) {
  if (y === 0) return 'dirt';
  else if (y === 1) return 'grass';
  else return 'stone';
}

// Place block from inventory
function placeBlock() {
  const blockData = inventory.blocks[inventory.selectedBlock];
  if (blockData.count > 0) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ map: blockData.texture });
    const block = new THREE.Mesh(geometry, material);
    block.position.copy(player.position);
    block.position.y = Math.floor(player.position.y); // Place on ground
    scene.add(block);
    blockData.count--; // Decrease count in inventory
    updateInventoryDisplay(); // Update the UI
  }
}

// Handle key presses for placing blocks
document.addEventListener('keydown', (event) => {
  if (event.key === ' ') { // Spacebar to place block
    placeBlock();
  }
});

// Mouse events for breaking blocks
document.addEventListener('mousedown', () => breakingBlock = true);
document.addEventListener('mouseup', () => breakingBlock = false);

// Game Loop
function animate() {
  requestAnimationFrame(animate);
  generateChunks(); // Generate chunks around the player
  checkBlockBreaking(); // Check for block breaking
  // Basic player movement (update this as necessary)
  camera.position.set(player.position.x, player.position.y + 5, player.position.z + 10);
  camera.lookAt(player.position);
  renderer.render(scene, camera);
}

animate();
