/**
 * UI控制模块
 * 处理游戏界面的切换和交互
 */

// 当前活跃的屏幕
let activeScreen = 'main-menu';

// 主题预览画布
let themePreviewCanvas;
let themePreviewCtx;

/**
 * 显示指定的屏幕
 * @param {string} screenId 要显示的屏幕ID
 */
function showScreen(screenId) {
    // 隐藏所有屏幕
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // 显示指定屏幕
    document.getElementById(screenId).classList.add('active');
    
    // 更新当前活跃屏幕
    activeScreen = screenId;
    
    // 如果是设置界面，初始化主题预览
    if (screenId === 'settings-screen' && themePreviewCanvas) {
        updateThemePreview();
    }
}

/**
 * 初始化UI事件
 * @param {TetrisGame} game 游戏实例
 */
function initUI(game) {
    // 创建主题预览画布
    createThemePreviewCanvas();
    
    // 主菜单按钮
    document.getElementById('start-game').addEventListener('click', () => {
        showScreen('game-screen');
        game.startGame();
    });
    
    document.getElementById('settings-btn').addEventListener('click', () => {
        // 在显示设置界面前，更新设置控件的值
        updateSettingsUI(game.settings);
        showScreen('settings-screen');
    });
    
    document.getElementById('help-btn').addEventListener('click', () => {
        showScreen('help-screen');
    });
    
    document.getElementById('leaderboard-btn').addEventListener('click', () => {
        updateLeaderboard();
        showScreen('leaderboard-screen');
    });
    
    // 游戏控制按钮
    document.getElementById('pause-btn').addEventListener('click', () => {
        if (game.state === GAME_STATES.PLAYING) {
            game.pauseGame();
        } else if (game.state === GAME_STATES.PAUSED) {
            game.resumeGame();
        }
    });
    
    document.getElementById('restart-btn').addEventListener('click', () => {
        game.startGame();
    });
    
    document.getElementById('menu-btn').addEventListener('click', () => {
        game.endGame();
        showScreen('main-menu');
    });
    
    // 游戏结束界面按钮
    document.getElementById('play-again-btn').addEventListener('click', () => {
        showScreen('game-screen');
        game.startGame();
    });
    
    document.getElementById('back-to-menu-btn').addEventListener('click', () => {
        showScreen('main-menu');
    });
    
    document.getElementById('share-score-btn').addEventListener('click', () => {
        shareScore(game.score);
    });
    
    // 设置界面按钮
    document.getElementById('save-settings').addEventListener('click', () => {
        saveSettings(game);
        showScreen('main-menu');
    });
    
    document.getElementById('back-from-settings').addEventListener('click', () => {
        showScreen('main-menu');
    });
    
    // 主题选择变化时更新预览
    document.getElementById('theme').addEventListener('change', () => {
        updateThemePreview();
    });
    
    // 帮助界面按钮
    document.getElementById('back-from-help').addEventListener('click', () => {
        showScreen('main-menu');
    });
    
    // 排行榜界面按钮
    document.getElementById('back-from-leaderboard').addEventListener('click', () => {
        showScreen('main-menu');
    });
}

/**
 * 创建主题预览画布
 */
function createThemePreviewCanvas() {
    // 创建预览画布容器
    const settingsContent = document.querySelector('.settings-content');
    const themeItem = document.querySelector('.setting-item:last-child');
    
    const previewContainer = document.createElement('div');
    previewContainer.className = 'theme-preview-container';
    previewContainer.style.marginTop = '20px';
    previewContainer.style.textAlign = 'center';
    
    const previewTitle = document.createElement('h3');
    previewTitle.textContent = '主题预览';
    previewTitle.style.marginBottom = '10px';
    
    themePreviewCanvas = document.createElement('canvas');
    themePreviewCanvas.id = 'theme-preview-canvas';
    themePreviewCanvas.width = 240;
    themePreviewCanvas.height = 120;
    themePreviewCanvas.style.border = '2px solid var(--border-color)';
    themePreviewCanvas.style.borderRadius = '5px';
    themePreviewCanvas.style.backgroundColor = 'var(--game-bg-color)';
    
    previewContainer.appendChild(previewTitle);
    previewContainer.appendChild(themePreviewCanvas);
    
    // 插入到设置项之后
    themeItem.parentNode.insertBefore(previewContainer, themeItem.nextSibling);
    
    // 获取画布上下文
    themePreviewCtx = themePreviewCanvas.getContext('2d');
}

/**
 * 更新主题预览
 */
function updateThemePreview() {
    if (!themePreviewCanvas || !themePreviewCtx) return;
    
    // 获取当前选择的主题和游戏背景
    const theme = document.getElementById('theme').value;
    const gameBg = document.getElementById('game-bg').value;
    const blockStyle = document.getElementById('block-style').value;
    
    // 临时应用主题以获取CSS变量
    const originalTheme = document.body.getAttribute('data-theme');
    document.body.setAttribute('data-theme', theme);
    
    // 临时应用方块颜色风格
    const originalI = document.documentElement.style.getPropertyValue('--i-block-color');
    const originalJ = document.documentElement.style.getPropertyValue('--j-block-color');
    const originalL = document.documentElement.style.getPropertyValue('--l-block-color');
    const originalO = document.documentElement.style.getPropertyValue('--o-block-color');
    const originalS = document.documentElement.style.getPropertyValue('--s-block-color');
    const originalT = document.documentElement.style.getPropertyValue('--t-block-color');
    const originalZ = document.documentElement.style.getPropertyValue('--z-block-color');
    
    applyBlockStyle(blockStyle);
    
    // 清空画布
    themePreviewCtx.clearRect(0, 0, themePreviewCanvas.width, themePreviewCanvas.height);
    
    // 绘制背景 - 使用当前选择的游戏背景色
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue(`--game-bg-${gameBg}`).trim();
    themePreviewCtx.fillStyle = bgColor || '#ffffff';
    themePreviewCtx.fillRect(0, 0, themePreviewCanvas.width, themePreviewCanvas.height);
    
    // 绘制网格
    themePreviewCtx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-color');
    themePreviewCtx.lineWidth = 0.5;
    
    const blockSize = 30;
    for (let i = 0; i <= themePreviewCanvas.height / blockSize; i++) {
        themePreviewCtx.beginPath();
        themePreviewCtx.moveTo(0, i * blockSize);
        themePreviewCtx.lineTo(themePreviewCanvas.width, i * blockSize);
        themePreviewCtx.stroke();
    }
    
    for (let i = 0; i <= themePreviewCanvas.width / blockSize; i++) {
        themePreviewCtx.beginPath();
        themePreviewCtx.moveTo(i * blockSize, 0);
        themePreviewCtx.lineTo(i * blockSize, themePreviewCanvas.height);
        themePreviewCtx.stroke();
    }
    
    // 绘制不同类型的方块
    const blockTypes = ['i', 'j', 'l', 'o', 's', 't', 'z'];
    const colors = blockTypes.map(type => 
        getComputedStyle(document.documentElement).getPropertyValue(`--${type}-block-color`)
    );
    
    // 绘制每种方块
    for (let i = 0; i < blockTypes.length; i++) {
        const x = (i % 4) * blockSize + 30;
        const y = Math.floor(i / 4) * blockSize + 30;
        
        // 绘制方块
        drawPreviewBlock(x, y, colors[i], blockSize);
    }
    
    // 恢复原始方块颜色
    document.documentElement.style.setProperty('--i-block-color', originalI);
    document.documentElement.style.setProperty('--j-block-color', originalJ);
    document.documentElement.style.setProperty('--l-block-color', originalL);
    document.documentElement.style.setProperty('--o-block-color', originalO);
    document.documentElement.style.setProperty('--s-block-color', originalS);
    document.documentElement.style.setProperty('--t-block-color', originalT);
    document.documentElement.style.setProperty('--z-block-color', originalZ);
    
    // 恢复原始主题
    document.body.setAttribute('data-theme', originalTheme);
}

/**
 * 绘制预览方块
 */
function drawPreviewBlock(x, y, color, blockSize) {
    // 绘制方块主体
    themePreviewCtx.fillStyle = color;
    themePreviewCtx.fillRect(x, y, blockSize, blockSize);
    
    // 绘制方块内部渐变
    const gradient = themePreviewCtx.createLinearGradient(x, y, x + blockSize, y + blockSize);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    themePreviewCtx.fillStyle = gradient;
    themePreviewCtx.fillRect(x, y, blockSize, blockSize);
    
    // 绘制方块边框
    themePreviewCtx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--block-border');
    themePreviewCtx.lineWidth = 1;
    themePreviewCtx.strokeRect(x, y, blockSize, blockSize);
    
    // 绘制方块高光
    themePreviewCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--block-highlight');
    themePreviewCtx.beginPath();
    themePreviewCtx.moveTo(x, y);
    themePreviewCtx.lineTo(x + blockSize, y);
    themePreviewCtx.lineTo(x + blockSize * 0.8, y + blockSize * 0.2);
    themePreviewCtx.lineTo(x + blockSize * 0.2, y + blockSize * 0.2);
    themePreviewCtx.lineTo(x, y);
    themePreviewCtx.fill();
    
    // 绘制方块阴影
    themePreviewCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    themePreviewCtx.beginPath();
    themePreviewCtx.moveTo(x + blockSize, y);
    themePreviewCtx.lineTo(x + blockSize, y + blockSize);
    themePreviewCtx.lineTo(x, y + blockSize);
    themePreviewCtx.lineTo(x + blockSize * 0.2, y + blockSize * 0.8);
    themePreviewCtx.lineTo(x + blockSize * 0.8, y + blockSize * 0.8);
    themePreviewCtx.lineTo(x + blockSize, y);
    themePreviewCtx.fill();
}

/**
 * 更新设置界面的UI
 * @param {Object} settings 当前游戏设置
 */
function updateSettingsUI(settings) {
    document.getElementById('difficulty').value = settings.difficulty;
    document.getElementById('sound-toggle').checked = settings.sound;
    document.getElementById('music-toggle').checked = settings.music;
    document.getElementById('theme').value = settings.theme;
    document.getElementById('game-bg').value = settings.gameBg || 'white';
    document.getElementById('block-style').value = settings.blockStyle || 'classic';
    
    // 更新主题预览
    updateThemePreview();
}

/**
 * 保存设置
 * @param {TetrisGame} game 游戏实例
 */
function saveSettings(game) {
    // 获取设置值
    const difficulty = document.getElementById('difficulty').value;
    const sound = document.getElementById('sound-toggle').checked;
    const music = document.getElementById('music-toggle').checked;
    const theme = document.getElementById('theme').value;
    const gameBg = document.getElementById('game-bg').value;
    const blockStyle = document.getElementById('block-style').value;
    
    // 更新游戏设置
    game.settings = {
        difficulty,
        sound,
        music,
        theme,
        gameBg,
        blockStyle
    };
    
    // 应用设置
    document.body.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--current-game-bg', `var(--game-bg-${gameBg})`);
    
    // 应用方块颜色风格
    applyBlockStyle(blockStyle);
    
    game.updateSoundSettings();
    
    // 保存到本地存储
    game.saveSettings();
}

/**
 * 应用方块颜色风格
 * @param {string} blockStyle 方块颜色风格
 */
function applyBlockStyle(blockStyle) {
    document.documentElement.style.setProperty('--i-block-color', `var(--block-style-${blockStyle}-i)`);
    document.documentElement.style.setProperty('--j-block-color', `var(--block-style-${blockStyle}-j)`);
    document.documentElement.style.setProperty('--l-block-color', `var(--block-style-${blockStyle}-l)`);
    document.documentElement.style.setProperty('--o-block-color', `var(--block-style-${blockStyle}-o)`);
    document.documentElement.style.setProperty('--s-block-color', `var(--block-style-${blockStyle}-s)`);
    document.documentElement.style.setProperty('--t-block-color', `var(--block-style-${blockStyle}-t)`);
    document.documentElement.style.setProperty('--z-block-color', `var(--block-style-${blockStyle}-z)`);
}

/**
 * 更新排行榜
 */
function updateLeaderboard() {
    const leaderboardEntries = document.getElementById('leaderboard-entries');
    leaderboardEntries.innerHTML = '';
    
    // 获取高分记录
    const highScores = JSON.parse(localStorage.getItem(STORAGE_KEYS.HIGH_SCORES) || '[]');
    
    if (highScores.length === 0) {
        // 如果没有记录，显示提示
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-leaderboard';
        emptyMessage.textContent = '暂无记录';
        leaderboardEntries.appendChild(emptyMessage);
    } else {
        // 显示排行榜
        highScores.forEach((score, index) => {
            const entry = document.createElement('div');
            entry.className = 'leaderboard-entry';
            
            const rank = document.createElement('div');
            rank.className = 'rank';
            rank.textContent = index + 1;
            
            const name = document.createElement('div');
            name.className = 'player-name';
            name.textContent = score.name;
            
            const scoreValue = document.createElement('div');
            scoreValue.className = 'player-score';
            scoreValue.textContent = score.score;
            
            entry.appendChild(rank);
            entry.appendChild(name);
            entry.appendChild(scoreValue);
            
            leaderboardEntries.appendChild(entry);
        });
    }
}

/**
 * 分享得分
 * @param {number} score 游戏得分
 */
function shareScore(score) {
    // 如果支持Web Share API
    if (navigator.share) {
        navigator.share({
            title: '俄罗斯方块游戏得分',
            text: `我在俄罗斯方块游戏中获得了 ${score} 分！来挑战我吧！`,
            url: window.location.href
        }).catch(error => {
            console.log('分享失败:', error);
        });
    } else {
        // 如果不支持，可以提供复制到剪贴板的功能
        const shareText = `我在俄罗斯方块游戏中获得了 ${score} 分！来挑战我吧！`;
        
        // 创建临时输入框
        const tempInput = document.createElement('input');
        tempInput.value = shareText;
        document.body.appendChild(tempInput);
        
        // 选择并复制文本
        tempInput.select();
        document.execCommand('copy');
        
        // 移除临时输入框
        document.body.removeChild(tempInput);
        
        // 显示提示
        alert('得分信息已复制到剪贴板！');
    }
}

// 添加游戏背景选择变化事件监听
document.getElementById('game-bg').addEventListener('change', () => {
    const gameBg = document.getElementById('game-bg').value;
    document.documentElement.style.setProperty('--current-game-bg', `var(--game-bg-${gameBg})`);
    updateThemePreview();
});

// 添加方块颜色风格选择变化事件监听
document.getElementById('block-style').addEventListener('change', () => {
    const blockStyle = document.getElementById('block-style').value;
    applyBlockStyle(blockStyle);
    updateThemePreview();
}); 