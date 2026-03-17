// This is your "Database"
let blogData = [
    {
        id: 1,
        title: "The Business Guy Investigation",
        excerpt: "A deep dive into offshore fraud...",
        image: "https://via.placeholder.com/400x200",
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        content: [
            { type: 'heading', value: 'The Evidence' },
            { type: 'text', value: 'Detailed styled text goes here...' }
        ]
    }
];

const container = document.getElementById('blog-container');
let editingId = null;

// Load posts from localStorage (or remote URL if set)
function loadPosts() {
    const saved = localStorage.getItem('blogPosts');
    if (saved) {
        blogData = JSON.parse(saved);
    }
}

// Save posts to localStorage
function savePosts() {
    localStorage.setItem('blogPosts', JSON.stringify(blogData));
}

// Toggle form visibility
function toggleForm() {
    const modal = document.getElementById('add-post-modal');
    modal.classList.toggle('hidden');

    const formTitle = document.getElementById('form-title');
    const submitBtn = document.querySelector('#add-post-form .submit-btn');
    const blocksContainer = document.getElementById('content-blocks');

    if (modal.classList.contains('hidden')) {
        editingId = null;
        formTitle.textContent = 'Create New Investigation';
        submitBtn.textContent = 'Add Investigation';
        blocksContainer.innerHTML = '';
    } else if (editingId !== null) {
        formTitle.textContent = 'Edit Investigation';
        submitBtn.textContent = 'Save Changes';
    } else {
        formTitle.textContent = 'Create New Investigation';
        submitBtn.textContent = 'Add Investigation';
        blocksContainer.innerHTML = '';
    }
}




// Utilities for dynamic blocks
function createBlockElement(type = 'text', value = '') {
    const blockId = 'block-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    const block = document.createElement('div');
    block.className = 'content-block';
    block.id = blockId;
    block.draggable = true;

    const toolbar = document.createElement('div');
    toolbar.className = 'block-toolbar';

    const select = document.createElement('select');
    select.className = 'block-type';
    ['text', 'heading', 'image', 'video'].forEach(optionType => {
        const option = document.createElement('option');
        option.value = optionType;
        option.textContent = optionType.charAt(0).toUpperCase() + optionType.slice(1);
        if (optionType === type) option.selected = true;
        select.appendChild(option);
    });
    select.addEventListener('change', () => changeBlockType(select, blockId));

    const addAboveBtn = document.createElement('button');
    addAboveBtn.type = 'button';
    addAboveBtn.className = 'insert-block-btn';
    addAboveBtn.textContent = 'Add Above';
    addAboveBtn.addEventListener('click', () => insertBlock(blockId, 'above'));

    const addBelowBtn = document.createElement('button');
    addBelowBtn.type = 'button';
    addBelowBtn.className = 'insert-block-btn';
    addBelowBtn.textContent = 'Add Below';
    addBelowBtn.addEventListener('click', () => insertBlock(blockId, 'below'));

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-block-btn';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => block.remove());

    toolbar.appendChild(select);
    toolbar.appendChild(addAboveBtn);
    toolbar.appendChild(addBelowBtn);
    toolbar.appendChild(removeBtn);

    const input = createInputForType(type, value);

    block.appendChild(toolbar);
    block.appendChild(input);

    // Drag & drop support
    block.addEventListener('dragstart', onBlockDragStart);
    block.addEventListener('dragover', onBlockDragOver);
    block.addEventListener('drop', onBlockDrop);
    block.addEventListener('dragend', onBlockDragEnd);

    return block;
}

function createInputForType(type, value) {
    let input;
    if (type === 'text') {
        input = document.createElement('textarea');
        input.placeholder = 'Enter text...';
        input.rows = 3;
        input.textContent = value;
    } else if (type === 'heading') {
        input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Enter heading...';
        input.value = value;
    } else if (type === 'image') {
        input = document.createElement('input');
        input.type = 'url';
        input.placeholder = 'Enter image URL...';
        input.value = value;
    } else if (type === 'video') {
        input = document.createElement('input');
        input.type = 'url';
        input.placeholder = 'Enter YouTube embed URL...';
        input.value = value;
    }

    input.className = 'block-input';
    return input;
}

// Insert a new block above/below an existing block
function insertBlock(referenceBlockId, position) {
    const reference = document.getElementById(referenceBlockId);
    if (!reference) return;

    const newBlock = createBlockElement('text', '');
    if (position === 'above') {
        reference.parentNode.insertBefore(newBlock, reference);
    } else {
        reference.parentNode.insertBefore(newBlock, reference.nextSibling);
    }
}

// Add content block dynamically (adds to end)
function addContentBlock(type) {
    const container = document.getElementById('content-blocks');
    const block = createBlockElement(type);
    container.appendChild(block);
}

// Change content block type
function changeBlockType(select, blockId) {
    const newType = select.value;
    const block = document.getElementById(blockId);
    const oldInput = block.querySelector('.block-input');
    const currentValue = oldInput.value || oldInput.textContent || '';

    const newInput = createInputForType(newType, currentValue);
    oldInput.replaceWith(newInput);
}

// Drag & drop helpers
let dragSrcEl = null;

function onBlockDragStart(event) {
    dragSrcEl = event.currentTarget;
    event.dataTransfer.effectAllowed = 'move';
}

function onBlockDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
}

function onBlockDrop(event) {
    event.preventDefault();
    const target = event.currentTarget;
    if (!dragSrcEl || target === dragSrcEl) return;

    const container = document.getElementById('content-blocks');
    const nodes = Array.from(container.children);
    const srcIndex = nodes.indexOf(dragSrcEl);
    const targetIndex = nodes.indexOf(target);

    if (srcIndex > -1 && targetIndex > -1) {
        if (srcIndex < targetIndex) {
            container.insertBefore(dragSrcEl, target.nextSibling);
        } else {
            container.insertBefore(dragSrcEl, target);
        }
    }
}

function onBlockDragEnd() {
    dragSrcEl = null;
}

// Get content blocks data
function getContentBlocksData() {
    const blocks = document.querySelectorAll('.content-block');
    const content = [];

    blocks.forEach(block => {
        const type = block.querySelector('.block-type').value;
        const input = block.querySelector('.block-input');
        const value = input.value ? input.value.trim() : input.textContent.trim();

        if (value) {
            content.push({ type, value });
        }
    });

    return content;
}

// Handle adding/updating post
function addPost(event) {
    event.preventDefault();
    
    const title = document.getElementById('post-title').value;
    const excerpt = document.getElementById('post-excerpt').value;
    const image = document.getElementById('post-image').value;
    const video = document.getElementById('post-video').value;
    const content = getContentBlocksData();
    
    if (content.length === 0) {
        alert('Please add at least one content block!');
        return;
    }
    
    if (editingId !== null) {
        // Update existing post
        const postIndex = blogData.findIndex(p => p.id === editingId);
        blogData[postIndex] = {
            id: editingId,
            title,
            excerpt,
            image,
            video,
            content
        };
    } else {
        // Create new post
        const newPost = {
            id: blogData.length > 0 ? Math.max(...blogData.map(p => p.id)) + 1 : 1,
            title,
            excerpt,
            image,
            video,
            content
        };
        blogData.push(newPost);
    }
    
    savePosts();
    
    // Reset form and close modal
    document.getElementById('add-post-form').reset();
    document.getElementById('content-blocks').innerHTML = '';
    toggleForm();
    
    // Re-render the home page
    renderHome();
}

// Edit post
function editPost(id) {
    editingId = id;
    const post = blogData.find(p => p.id === id);
    
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-excerpt').value = post.excerpt;
    document.getElementById('post-image').value = post.image;
    document.getElementById('post-video').value = post.video;
    
    // Clear and populate content blocks
    const blocksContainer = document.getElementById('content-blocks');
    blocksContainer.innerHTML = '';
    
    post.content.forEach(block => {
        const blockElement = createBlockElement(block.type, block.value);
        blocksContainer.appendChild(blockElement);
    });
    
    toggleForm();
}

// Delete post
function deletePost(id) {
    if (confirm('Are you sure you want to delete this investigation?')) {
        blogData = blogData.filter(p => p.id !== id);
        savePosts();
        renderHome();
    }
}

// Set up event listeners
document.getElementById('toggle-form-btn').addEventListener('click', toggleForm);
document.getElementById('add-post-form').addEventListener('submit', addPost);

function renderHome() {
    container.innerHTML = blogData.map(post => `
        <div class="blog-card" onclick="renderPost(${post.id})">
            <img src="${post.image}">
            <h3>${post.title}</h3>
            <p>${post.excerpt}</p>
            <strong>Read Investigation →</strong>
            <div class="card-actions" onclick="event.stopPropagation()">
                <button class="edit-btn" onclick="editPost(${post.id})">Edit</button>
                <button class="delete-btn" onclick="deletePost(${post.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function renderPost(id) {
    const post = blogData.find(p => p.id === id);
    let contentHtml = '';
    
    post.content.forEach(block => {
        if (block.type === 'heading') {
            contentHtml += `<h2>${block.value}</h2>`;
        } else if (block.type === 'text') {
            contentHtml += `<p>${block.value}</p>`;
        } else if (block.type === 'image') {
            contentHtml += `<img src="${block.value}" class="post-image" alt="Post image">`;
        } else if (block.type === 'video') {
            contentHtml += `<div class="video-container"><iframe src="${block.value}" frameborder="0" allowfullscreen></iframe></div>`;
        }
    });
    
    container.className = "full-post";
    container.innerHTML = `
        <button onclick="renderHome()" class="back-btn">← Back to Home</button>
        <h1>${post.title}</h1>
        <div class="post-actions">
            <button onclick="editPost(${post.id})" class="edit-btn">Edit</button>
            <button onclick="deletePost(${post.id})" class="delete-btn">Delete</button>
        </div>
        <div class="styled-text">${contentHtml}</div>
        <hr>
        <h3>References:</h3>
        <a href="#" onclick="renderHome(); return false;">← Back to all Investigations</a>
    `;
}

// Load posts on page load
(async () => {
    await loadPosts();
    renderHome();
})();