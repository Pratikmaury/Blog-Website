// 1. Import Firebase core and Firestore database
// 1. Import Firebase core and Firestore database
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 2. YOUR FIREBASE CONFIGURATION GOES HERE
// You will get this exact block of code from the Firebase Console (Instructions below)
  const firebaseConfig = {
    apiKey: "AIzaSyDXhyI05ZHHoRuHLLVqpG3-sU3d_ZROcmk",
    authDomain: "kloud-blogs.firebaseapp.com",
    projectId: "kloud-blogs",
    storageBucket: "kloud-blogs.firebasestorage.app",
    messagingSenderId: "807258699565",
    appId: "1:807258699565:web:cf48043cefb813a6bd85a4"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const postsCollection = collection(db, "investigations");

let blogData = [];
const container = document.getElementById('blog-container');
let editingId = null;

// Expose functions to the window object so HTML onclick handlers can find them
window.toggleForm = toggleForm;
window.addContentBlock = addContentBlock;
window.renderHome = renderHome;
window.renderPost = renderPost;
window.editPost = editPost;
window.deletePost = deletePost;

// Load posts from Firebase Firestore
async function loadPosts() {
    try {
        const querySnapshot = await getDocs(postsCollection);
        blogData = querySnapshot.docs.map(doc => ({
            id: doc.id, // Firebase generates a unique alphanumeric ID
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error loading posts:", error);
        alert("Failed to load posts. Check console.");
    }
}

function toggleForm() {
    const modal = document.getElementById('add-post-modal');
    modal.classList.toggle('hidden');

    const formTitle = document.getElementById('form-title');
    const submitBtn = document.querySelector('#add-post-form .submit-btn');
    const blocksContainer = document.getElementById('content-blocks');

    if (modal.classList.contains('hidden')) {
        editingId = null;
        document.getElementById('add-post-form').reset();
    } else if (editingId !== null) {
        formTitle.textContent = 'Edit Investigation';
        submitBtn.textContent = 'Save Changes';
    } else {
        formTitle.textContent = 'Create New Investigation';
        submitBtn.textContent = 'Add Investigation';
        blocksContainer.innerHTML = '';
    }
}

// Utilities for dynamic blocks (Unchanged visually, just scoped properly)
function createBlockElement(type = 'text', value = '', size = 'medium') {
    const blockId = 'block-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    const block = document.createElement('div');
    block.className = 'content-block';
    block.id = blockId;

    const toolbar = document.createElement('div');
    toolbar.className = 'block-toolbar';

    const select = document.createElement('select');
    select.className = 'block-type';
    ['text', 'heading', 'image', 'video', 'divider'].forEach(optionType => {
        const option = document.createElement('option');
        option.value = optionType;
        option.textContent = optionType.charAt(0).toUpperCase() + optionType.slice(1);
        if (optionType === type) option.selected = true;
        select.appendChild(option);
    });
    
    select.addEventListener('change', () => {
        const newType = select.value;
        const oldInput = block.querySelector('.block-input');
        const currentValue = oldInput ? (oldInput.value || oldInput.textContent || '') : '';
        const sizeSelect = block.querySelector('.block-size');
        const currentSize = sizeSelect ? sizeSelect.value : 'medium';
        const newInput = createInputForType(newType, currentValue);
        if (oldInput) oldInput.replaceWith(newInput);
        if (sizeSelect && !['image', 'video'].includes(newType)) {
            sizeSelect.remove();
        } else if (!sizeSelect && ['image', 'video'].includes(newType)) {
            const newSizeSelect = createSizeSelect(currentSize);
            toolbar.insertBefore(newSizeSelect, insertBtn);
        }
    });

    const insertBtn = document.createElement('button');
    insertBtn.type = 'button';
    insertBtn.className = 'insert-block-btn';
    insertBtn.textContent = 'Insert';
    insertBtn.addEventListener('click', () => {
        const container = document.getElementById('content-blocks');
        const blocks = Array.from(container.children);
        const index = blocks.indexOf(block);
        addContentBlock('text', index + 1);
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-block-btn';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => block.remove());

    toolbar.appendChild(select);
    if (['image', 'video'].includes(type)) {
        const sizeSelect = createSizeSelect(size);
        toolbar.appendChild(sizeSelect);
    }
    toolbar.appendChild(insertBtn);
    toolbar.appendChild(removeBtn);

    const input = createInputForType(type, value);
    block.appendChild(toolbar);
    block.appendChild(input);

    return block;
}

function createSizeSelect(size = 'medium') {
    const select = document.createElement('select');
    select.className = 'block-size';
    ['small', 'medium', 'large'].forEach(sizeOption => {
        const option = document.createElement('option');
        option.value = sizeOption;
        option.textContent = sizeOption.charAt(0).toUpperCase() + sizeOption.slice(1);
        if (sizeOption === size) option.selected = true;
        select.appendChild(option);
    });
    return select;
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
        input = document.createElement('textarea');
        input.placeholder = 'Enter image URLs separated by commas...';
        input.rows = 2;
        input.textContent = value;
    } else if (type === 'video') {
        input = document.createElement('textarea');
        input.placeholder = 'Enter YouTube embed URLs separated by commas...';
        input.rows = 2;
        input.textContent = value;
    } else if (type === 'divider') {
        input = document.createElement('div');
        input.textContent = 'Horizontal Line';
        input.style.fontStyle = 'italic';
        input.style.color = '#888';
    }
    if (input) input.className = 'block-input';
    return input;
}

function addContentBlock(type, position = -1) {
    const container = document.getElementById('content-blocks');
    const block = createBlockElement(type);
    if (position === -1 || position >= container.children.length) {
        container.appendChild(block);
    } else {
        container.insertBefore(block, container.children[position]);
    }
}

function getContentBlocksData() {
    const blocks = document.querySelectorAll('.content-block');
    const content = [];
    blocks.forEach(block => {
        const type = block.querySelector('.block-type').value;
        const input = block.querySelector('.block-input');
        const value = input.value ? input.value.trim() : input.textContent.trim();
        const sizeSelect = block.querySelector('.block-size');
        const size = sizeSelect ? sizeSelect.value : null;
        if (type === 'divider' || value) {
            const blockData = { type, value };
            if (size) blockData.size = size;
            content.push(blockData);
        }
    });
    return content;
}

// Handle adding/updating post to Firebase
document.getElementById('add-post-form').addEventListener('submit', async (event) => {
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

    const postData = { title, excerpt, image, video, content, createdAt: Date.now() };
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.textContent = "Saving...";
    submitBtn.disabled = true;

    try {
        if (editingId !== null) {
            // Update in Firebase
            const postRef = doc(db, "investigations", editingId);
            await updateDoc(postRef, postData);
        } else {
            // Add to Firebase
            await addDoc(postsCollection, postData);
        }
        
        // Refresh data and UI
        await loadPosts();
        toggleForm();
        renderHome();
    } catch (error) {
        console.error("Error saving post: ", error);
        alert("Error saving. Check console.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = editingId ? "Save Changes" : "Add Investigation";
    }
});

function editPost(id) {
    editingId = id;
    const post = blogData.find(p => p.id === id);
    
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-excerpt').value = post.excerpt;
    document.getElementById('post-image').value = post.image || '';
    document.getElementById('post-video').value = post.video || '';
    
    const blocksContainer = document.getElementById('content-blocks');
    blocksContainer.innerHTML = '';
    
    post.content.forEach(block => {
        const blockElement = createBlockElement(block.type, block.value, block.size || 'medium');
        blocksContainer.appendChild(blockElement);
    });
    
    const modal = document.getElementById('add-post-modal');
    if(modal.classList.contains('hidden')) {
        toggleForm();
    }
}

async function deletePost(id) {
    if (confirm('Are you sure you want to delete this investigation?')) {
        try {
            // Delete from Firebase
            await deleteDoc(doc(db, "investigations", id));
            // Remove locally and re-render
            blogData = blogData.filter(p => p.id !== id);
            renderHome();
        } catch (error) {
            console.error("Error deleting document: ", error);
            alert("Failed to delete.");
        }
    }
}

function renderHome() {
    // Sort by newest first
    const sortedData = [...blogData].sort((a, b) => b.createdAt - a.createdAt);

    container.className = "grid-container";
    container.innerHTML = sortedData.map(post => `
        <div class="blog-card" onclick="renderPost('${post.id}')">
            <img src="${post.image}" onerror="this.src='https://via.placeholder.com/400x200'">
            <h3>${post.title}</h3>
            <p>${post.excerpt}</p>
            <strong>Read Investigation →</strong>
            <div class="card-actions" onclick="event.stopPropagation()">
                <button class="edit-btn" onclick="editPost('${post.id}')">Edit</button>
                <button class="delete-btn" onclick="deletePost('${post.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function renderPost(id) {
    const post = blogData.find(p => p.id === id);
    if(!post) return;

    let contentHtml = '';
    
    post.content.forEach(block => {
        if (block.type === 'heading') {
            contentHtml += `<h2>${block.value}</h2>`;
        } else if (block.type === 'text') {
            contentHtml += `<p>${block.value}</p>`;
        } else if (block.type === 'image') {
            const urls = block.value.split(',').map(u => u.trim()).filter(u => u);
            const sizeClass = block.size ? `size-${block.size}` : 'size-medium';
            if (urls.length === 1) {
                contentHtml += `<img src="${urls[0]}" class="post-image ${sizeClass}" alt="Post image">`;
            } else {
                contentHtml += `<div class="image-gallery ${sizeClass}">`;
                urls.forEach(url => {
                    contentHtml += `<img src="${url}" alt="Post image">`;
                });
                contentHtml += `</div>`;
            }
        } else if (block.type === 'video') {
            const urls = block.value.split(',').map(u => u.trim()).filter(u => u);
            const sizeClass = block.size ? `size-${block.size}` : 'size-medium';
            if (urls.length === 1) {
                contentHtml += `<div class="video-container ${sizeClass}"><iframe src="${urls[0]}" frameborder="0" allowfullscreen></iframe></div>`;
            } else {
                contentHtml += `<div class="video-gallery ${sizeClass}">`;
                urls.forEach(url => {
                    contentHtml += `<div class="video-container"><iframe src="${url}" frameborder="0" allowfullscreen></iframe></div>`;
                });
                contentHtml += `</div>`;
            }
        } else if (block.type === 'divider') {
            contentHtml += `<hr>`;
        }
    });
    
    container.className = "full-post";
    container.innerHTML = `
        <button onclick="renderHome()" class="back-btn">← Back to Home</button>
        <h1>${post.title}</h1>
        <div class="post-actions">
            <button onclick="editPost('${post.id}')" class="edit-btn">Edit</button>
            <button onclick="deletePost('${post.id}')" class="delete-btn">Delete</button>
        </div>
        <div class="styled-text">${contentHtml}</div>
        <hr>
        <a href="#" onclick="renderHome(); return false;" style="color: #d32f2f; font-weight: bold; text-decoration: none;">← Back to all Investigations</a>
    `;
}

// Initial Boot
(async () => {
    container.innerHTML = "<h2>Loading investigations...</h2>";
    await loadPosts();
    renderHome();
})();