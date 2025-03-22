/**
 * 俄罗斯方块游戏核心逻辑
 */
class TetrisGame {
    constructor(canvas, nextPieceCanvas) {
        // 游戏画布
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 下一个方块预览画布
        this.nextPieceCanvas = nextPieceCanvas;
        this.nextPieceCtx = nextPieceCanvas.getContext('2d');
        
        // 设置画布大小
        this.resizeCanvas();
        
        // 游戏状态
        this.state = GAME_STATES.MENU;
        
        // 游戏设置
        this.settings = this.loadSettings();
        
        // 游戏数据
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameSpeed = this.getSpeedForLevel();
        
        // 新增连击系统
        this.combo = 0;
        this.maxCombo = 0;
        
        // 特殊效果追踪
        this.specialEffects = {
            active: false,
            type: null,
            duration: 0,
            startTime: 0
        };
        
        // 游戏板
        this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        
        // 当前方块和下一个方块
        this.currentPiece = null;
        this.nextPiece = null;
        
        // 游戏循环
        this.dropCounter = 0;
        this.lastTime = 0;
        this.animationId = null;
        
        // 音效
        this.sounds = {
            move: document.getElementById('move-sound'),
            rotate: document.getElementById('rotate-sound'),
            drop: document.getElementById('drop-sound'),
            clear: document.getElementById('clear-sound'),
            gameOver: document.getElementById('game-over-sound'),
            background: document.getElementById('background-music')
        };
        
        // 游戏统计
        this.stats = {
            piecesPlaced: 0,
            specialPiecesUsed: 0,
            totalScore: 0,
            maxCombo: 0,
            totalLines: 0,
            timePlayed: 0,
            gameStartTime: 0
        };
        
        // 成就系统
        this.achievements = this.loadAchievements();
        
        // 初始化
        this.init();
    }
    
    /**
     * 初始化游戏
     */
    init() {
        // 应用主题
        document.body.setAttribute('data-theme', this.settings.theme);
        
        // 应用游戏背景色
        if (this.settings.gameBg) {
            document.documentElement.style.setProperty('--current-game-bg', `var(--game-bg-${this.settings.gameBg})`);
        } else {
            document.documentElement.style.setProperty('--current-game-bg', 'var(--game-bg-white)');
        }
        
        // 应用方块颜色风格
        if (this.settings.blockStyle) {
            applyBlockStyle(this.settings.blockStyle);
        } else {
            applyBlockStyle('classic');
        }
        
        // 设置音效和音乐
        this.updateSoundSettings();
        
        // 绑定事件
        window.addEventListener('resize', () => this.resizeCanvas());
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // 移动设备控制
        this.setupMobileControls();
    }
    
    /**
     * 调整画布大小
     */
    resizeCanvas() {
        // 主游戏画布
        this.canvas.width = COLS * this.getBlockSize();
        this.canvas.height = ROWS * this.getBlockSize();
        
        // 下一个方块预览画布
        this.nextPieceCanvas.width = 120;
        this.nextPieceCanvas.height = 120;
        
        // 如果游戏正在进行，重新绘制
        if (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED) {
            this.draw();
        }
    }
    
    /**
     * 获取当前方块大小
     */
    getBlockSize() {
        const computedStyle = getComputedStyle(document.documentElement);
        return parseInt(computedStyle.getPropertyValue('--block-size'));
    }
    
    /**
     * 加载游戏设置
     */
    loadSettings() {
        const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        return savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS;
    }
    
    /**
     * 保存游戏设置
     */
    saveSettings() {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    }
    
    /**
     * 更新声音设置
     */
    updateSoundSettings() {
        // 设置音效
        Object.values(this.sounds).forEach(sound => {
            if (sound !== this.sounds.background) {
                sound.muted = !this.settings.sound;
            }
        });
        
        // 设置背景音乐
        if (this.settings.music) {
            this.sounds.background.volume = 0.5;
            this.sounds.background.muted = false;
            if (this.state === GAME_STATES.PLAYING) {
                this.sounds.background.play().catch(() => {
                    // 自动播放可能被浏览器阻止，忽略错误
                });
            }
        } else {
            this.sounds.background.muted = true;
            this.sounds.background.pause();
        }
    }
    
    /**
     * 设置移动设备控制
     */
    setupMobileControls() {
        // 左移按钮
        document.getElementById('left-btn').addEventListener('click', () => {
            if (this.state === GAME_STATES.PLAYING) {
                this.movePiece(DIRECTIONS.LEFT);
            }
        });
        
        // 右移按钮
        document.getElementById('right-btn').addEventListener('click', () => {
            if (this.state === GAME_STATES.PLAYING) {
                this.movePiece(DIRECTIONS.RIGHT);
            }
        });
        
        // 下移按钮
        document.getElementById('down-btn').addEventListener('click', () => {
            if (this.state === GAME_STATES.PLAYING) {
                this.movePiece(DIRECTIONS.DOWN);
            }
        });
        
        // 旋转按钮
        document.getElementById('rotate-btn').addEventListener('click', () => {
            if (this.state === GAME_STATES.PLAYING) {
                this.rotatePiece();
            }
        });
        
        // 快速下落按钮
        document.getElementById('drop-btn').addEventListener('click', () => {
            if (this.state === GAME_STATES.PLAYING) {
                this.hardDrop();
            }
        });
    }
    
    /**
     * 处理键盘按键
     */
    handleKeyPress(event) {
        if (this.state !== GAME_STATES.PLAYING) {
            // 如果游戏暂停，只响应继续游戏的按键
            if (event.keyCode === KEY_CODES.P && this.state === GAME_STATES.PAUSED) {
                this.resumeGame();
            }
            return;
        }
        
        switch (event.keyCode) {
            case KEY_CODES.LEFT:
                this.movePiece(DIRECTIONS.LEFT);
                break;
            case KEY_CODES.RIGHT:
                this.movePiece(DIRECTIONS.RIGHT);
                break;
            case KEY_CODES.DOWN:
                this.movePiece(DIRECTIONS.DOWN);
                break;
            case KEY_CODES.UP:
                this.rotatePiece();
                break;
            case KEY_CODES.SPACE:
                this.hardDrop();
                break;
            case KEY_CODES.P:
                this.pauseGame();
                break;
            case KEY_CODES.ESC:
                this.endGame();
                break;
        }
    }
    
    /**
     * 开始新游戏
     */
    startGame() {
        // 重置游戏数据
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameSpeed = this.getSpeedForLevel();
        this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        
        // 重置连击
        this.combo = 0;
        this.maxCombo = 0;
        
        // 重置特效
        this.specialEffects = {
            active: false,
            type: null,
            duration: 0,
            startTime: 0
        };
        
        // 更新统计 - 记录游戏开始时间
        this.stats.gameStartTime = Date.now();
        
        // 生成方块
        this.currentPiece = getRandomTetromino();
        this.nextPiece = getRandomTetromino();
        
        // 更新UI
        this.updateScore();
        
        // 设置游戏状态
        this.state = GAME_STATES.PLAYING;
        
        // 播放背景音乐
        if (this.settings.music) {
            this.sounds.background.currentTime = 0;
            this.sounds.background.play().catch(() => {
                // 自动播放可能被浏览器阻止，忽略错误
            });
        }
        
        // 开始游戏循环
        this.lastTime = 0;
        this.update();
    }
    
    /**
     * 暂停游戏
     */
    pauseGame() {
        if (this.state === GAME_STATES.PLAYING) {
            this.state = GAME_STATES.PAUSED;
            this.sounds.background.pause();
            cancelAnimationFrame(this.animationId);
            
            // 显示暂停提示
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏暂停', this.canvas.width / 2, this.canvas.height / 2 - 30);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('按 P 键继续', this.canvas.width / 2, this.canvas.height / 2 + 10);
        }
    }
    
    /**
     * 继续游戏
     */
    resumeGame() {
        if (this.state === GAME_STATES.PAUSED) {
            this.state = GAME_STATES.PLAYING;
            if (this.settings.music) {
                this.sounds.background.play().catch(() => {});
            }
            this.lastTime = 0;
            this.update();
        }
    }
    
    /**
     * 结束游戏
     */
    endGame() {
        this.state = GAME_STATES.GAME_OVER;
        cancelAnimationFrame(this.animationId);
        this.sounds.background.pause();
        
        if (this.settings.sound) {
            this.sounds.gameOver.play().catch(() => {});
        }
        
        // 更新游戏统计
        this.updateGameStats();
        
        // 检查成就
        this.checkAchievements();
        
        // 保存成就和统计
        this.saveAchievements();
        
        // 保存高分
        this.saveHighScore();
        
        // 显示游戏结束界面
        document.getElementById('final-score-value').textContent = this.score;
        showScreen('game-over');
    }
    
    /**
     * 更新游戏统计
     */
    updateGameStats() {
        // 计算游戏时长（秒）
        const gameTimeSeconds = Math.floor((Date.now() - this.stats.gameStartTime) / 1000);
        
        // 更新统计
        this.stats.timePlayed += gameTimeSeconds;
        this.stats.totalScore += this.score;
        this.stats.totalLines += this.lines;
        this.stats.maxCombo = Math.max(this.stats.maxCombo, this.maxCombo);
        
        // 保存统计
        localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(this.stats));
    }
    
    /**
     * 加载成就
     */
    loadAchievements() {
        const defaultAchievements = {
            scoreAchievements: [
                { id: 'score_1000', name: '起步', description: '累计得分超过1000分', completed: false, target: 1000 },
                { id: 'score_10000', name: '高手', description: '累计得分超过10000分', completed: false, target: 10000 },
                { id: 'score_50000', name: '专家', description: '累计得分超过50000分', completed: false, target: 50000 }
            ],
            comboAchievements: [
                { id: 'combo_5', name: '连击者', description: '达成5连击', completed: false, target: 5 },
                { id: 'combo_10', name: '连击大师', description: '达成10连击', completed: false, target: 10 },
                { id: 'combo_15', name: '连击传奇', description: '达成15连击', completed: false, target: 15 }
            ],
            lineAchievements: [
                { id: 'line_50', name: '初级消除者', description: '累计消除50行', completed: false, target: 50 },
                { id: 'line_100', name: '中级消除者', description: '累计消除100行', completed: false, target: 100 },
                { id: 'line_500', name: '高级消除者', description: '累计消除500行', completed: false, target: 500 }
            ],
            specialAchievements: [
                { id: 'special_first', name: '首次特殊', description: '首次使用特殊方块', completed: false },
                { id: 'special_10', name: '特殊达人', description: '使用10个特殊方块', completed: false, target: 10 }
            ]
        };
        
        const savedAchievements = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
        return savedAchievements ? JSON.parse(savedAchievements) : defaultAchievements;
    }
    
    /**
     * 保存成就
     */
    saveAchievements() {
        localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(this.achievements));
    }
    
    /**
     * 检查成就
     */
    checkAchievements() {
        let newAchievements = [];
        
        // 检查分数成就
        this.achievements.scoreAchievements.forEach(achievement => {
            if (!achievement.completed && this.stats.totalScore >= achievement.target) {
                achievement.completed = true;
                newAchievements.push(achievement);
            }
        });
        
        // 检查连击成就
        this.achievements.comboAchievements.forEach(achievement => {
            if (!achievement.completed && this.stats.maxCombo >= achievement.target) {
                achievement.completed = true;
                newAchievements.push(achievement);
            }
        });
        
        // 检查行消除成就
        this.achievements.lineAchievements.forEach(achievement => {
            if (!achievement.completed && this.stats.totalLines >= achievement.target) {
                achievement.completed = true;
                newAchievements.push(achievement);
            }
        });
        
        // 检查特殊方块成就
        this.achievements.specialAchievements.forEach(achievement => {
            if (!achievement.completed) {
                if (achievement.id === 'special_first' && this.stats.specialPiecesUsed > 0) {
                    achievement.completed = true;
                    newAchievements.push(achievement);
                } else if (achievement.id === 'special_10' && this.stats.specialPiecesUsed >= achievement.target) {
                    achievement.completed = true;
                    newAchievements.push(achievement);
                }
            }
        });
        
        // 显示新获得的成就
        if (newAchievements.length > 0) {
            this.showNewAchievements(newAchievements);
        }
    }
    
    /**
     * 显示新获得的成就
     */
    showNewAchievements(achievements) {
        achievements.forEach((achievement, index) => {
            setTimeout(() => {
                const achievementElement = document.createElement('div');
                achievementElement.className = 'achievement-notification';
                
                achievementElement.innerHTML = `
                    <div class="achievement-icon">🏆</div>
                    <div class="achievement-content">
                        <div class="achievement-title">成就解锁: ${achievement.name}</div>
                        <div class="achievement-description">${achievement.description}</div>
                    </div>
                `;
                
                // 样式设置
                achievementElement.style.position = 'fixed';
                achievementElement.style.bottom = '20px';
                achievementElement.style.right = '-400px'; // 开始在屏幕外
                achievementElement.style.width = '350px';
                achievementElement.style.backgroundColor = 'rgba(50, 50, 50, 0.9)';
                achievementElement.style.borderLeft = '4px solid gold';
                achievementElement.style.color = 'white';
                achievementElement.style.padding = '15px';
                achievementElement.style.borderRadius = '5px';
                achievementElement.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.5)';
                achievementElement.style.zIndex = '1000';
                achievementElement.style.display = 'flex';
                achievementElement.style.alignItems = 'center';
                achievementElement.style.transition = 'right 0.5s ease-out';
                
                // 图标样式
                const iconElement = achievementElement.querySelector('.achievement-icon');
                iconElement.style.fontSize = '30px';
                iconElement.style.marginRight = '15px';
                iconElement.style.color = 'gold';
                
                // 标题样式
                const titleElement = achievementElement.querySelector('.achievement-title');
                titleElement.style.fontSize = '18px';
                titleElement.style.fontWeight = 'bold';
                titleElement.style.marginBottom = '5px';
                
                document.body.appendChild(achievementElement);
                
                // 动画效果
                setTimeout(() => {
                    achievementElement.style.right = '20px'; // 滑入
                    
                    // 3秒后滑出
                    setTimeout(() => {
                        achievementElement.style.right = '-400px';
                        
                        // 完全滑出后移除
                        setTimeout(() => {
                            achievementElement.remove();
                        }, 500);
                    }, 3000);
                }, 50);
            }, index * 3500); // 成就显示间隔
        });
    }
    
    /**
     * 锁定方块到游戏板
     */
    lockPiece() {
        const { shape, x, y, type, isSpecial, effect } = this.currentPiece;
        
        // 更新统计 - 放置的方块数
        this.stats.piecesPlaced++;
        
        // 检查是否为特殊方块，并触发特殊效果
        if (isSpecial) {
            // 更新统计 - 使用的特殊方块数
            this.stats.specialPiecesUsed++;
            
            switch (effect) {
                case 'rainbow':
                    this.triggerRainbowEffect();
                    return; // 彩虹效果会自行处理方块锁定，直接返回
                case 'bomb':
                    this.triggerBombEffect(x, y, shape);
                    return; // 炸弹效果会自行处理方块锁定，直接返回
            }
        }
        
        // 标准方块锁定流程
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardY = y + row;
                    
                    // 如果方块锁定在顶部以上，游戏结束
                    if (boardY < 0) {
                        this.endGame();
                        return;
                    }
                    
                    // 存储方块类型对应的CSS变量名
                    this.board[boardY][x + col] = {
                        type: type,
                        color: `var(--${type.toLowerCase()}-block-color)`,
                        isSpecial: isSpecial
                    };
                }
            }
        }
    }
    
    /**
     * 触发彩虹方块效果
     */
    triggerRainbowEffect() {
        // 彩虹方块效果：随机改变当前所有方块的颜色
        const blockTypes = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
        
        // 显示特效通知
        this.showEffectNotification('彩虹效果！', '#ff00ff');
        
        // 加分
        this.score += 1000;
        this.updateScore();
        
        // 播放特效音效
        if (this.settings.sound) {
            this.sounds.clear.currentTime = 0;
            this.sounds.clear.play().catch(() => {});
        }
        
        // 随机改变所有方块颜色
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.board[y][x] && !this.board[y][x].isSpecial) {
                    const randomType = blockTypes[Math.floor(Math.random() * blockTypes.length)];
                    this.board[y][x].type = randomType;
                    this.board[y][x].color = `var(--${randomType.toLowerCase()}-block-color)`;
                }
            }
        }
    }
    
    /**
     * 触发炸弹方块效果
     */
    triggerBombEffect(centerX, centerY, shape) {
        // 计算炸弹中心点
        let bombCenterX = centerX;
        let bombCenterY = centerY;
        
        // 找到形状中心
        const shapeCenterX = Math.floor(shape[0].length / 2);
        const shapeCenterY = Math.floor(shape.length / 2);
        
        // 炸弹中心点
        bombCenterX += shapeCenterX;
        bombCenterY += shapeCenterY;
        
        // 爆炸半径
        const radius = 3;
        
        // 显示特效通知
        this.showEffectNotification('爆炸！', '#ff4500');
        
        // 加分
        this.score += 500;
        this.updateScore();
        
        // 播放爆炸音效
        if (this.settings.sound) {
            this.sounds.clear.currentTime = 0;
            this.sounds.clear.play().catch(() => {});
        }
        
        // 清除爆炸范围内的方块
        for (let y = Math.max(0, bombCenterY - radius); y <= Math.min(ROWS - 1, bombCenterY + radius); y++) {
            for (let x = Math.max(0, bombCenterX - radius); x <= Math.min(COLS - 1, bombCenterX + radius); x++) {
                // 计算到炸弹中心的距离
                const distance = Math.sqrt(Math.pow(x - bombCenterX, 2) + Math.pow(y - bombCenterY, 2));
                
                // 在爆炸半径内的方块被清除
                if (distance <= radius) {
                    this.board[y][x] = 0;
                }
            }
        }
        
        // 处理悬空方块
        this.handleFloatingBlocks();
    }
    
    /**
     * 处理爆炸后的悬空方块
     */
    handleFloatingBlocks() {
        // 从底部向上遍历每一列
        for (let x = 0; x < COLS; x++) {
            let gaps = 0;
            
            // 从底部向上遍历
            for (let y = ROWS - 1; y >= 0; y--) {
                if (this.board[y][x] === 0) {
                    gaps++;
                } else if (gaps > 0) {
                    // 如果上面有方块而下面有空隙，移动方块
                    this.board[y + gaps][x] = this.board[y][x];
                    this.board[y][x] = 0;
                }
            }
        }
        
        // 检查是否有行被填满
        this.clearLines();
    }
    
    /**
     * 清除已填满的行
     */
    clearLines() {
        let linesCleared = 0;
        
        for (let row = ROWS - 1; row >= 0; row--) {
            // 检查当前行是否已填满
            if (this.board[row].every(cell => cell !== 0)) {
                // 移除当前行
                this.board.splice(row, 1);
                // 在顶部添加新的空行
                this.board.unshift(Array(COLS).fill(0));
                // 增加已清除行数
                linesCleared++;
                // 因为删除了一行，需要重新检查当前行
                row++;
            }
        }
        
        // 如果有行被清除
        if (linesCleared > 0) {
            // 播放清除音效
            if (this.settings.sound) {
                this.sounds.clear.currentTime = 0;
                this.sounds.clear.play().catch(() => {});
            }
            
            // 更新连击数
            this.combo++;
            this.maxCombo = Math.max(this.maxCombo, this.combo);
            
            // 连击奖励
            const comboBonus = Math.floor(this.combo * 50 * this.level);
            
            // 更新分数
            this.updateScoreForLines(linesCleared, comboBonus);
            
            // 更新已清除的行数
            this.lines += linesCleared;
            
            // 检查是否升级
            this.checkLevelUp();
            
            // 检查是否触发特殊效果
            this.checkSpecialEffects(linesCleared);
            
            // 更新UI
            this.updateScore();
            
            // 显示连击信息
            this.showComboInfo();
        } else {
            // 重置连击
            this.combo = 0;
        }
    }
    
    /**
     * 显示连击信息
     */
    showComboInfo() {
        if (this.combo > 1) {
            // 创建一个临时元素显示连击数
            const comboElement = document.createElement('div');
            comboElement.className = 'combo-indicator';
            comboElement.textContent = `${this.combo}连击！`;
            
            // 样式设置
            comboElement.style.position = 'absolute';
            comboElement.style.top = '50%';
            comboElement.style.left = '50%';
            comboElement.style.transform = 'translate(-50%, -50%)';
            comboElement.style.color = 'var(--primary-color)';
            comboElement.style.fontSize = `${Math.min(24 + this.combo * 2, 48)}px`;
            comboElement.style.fontWeight = 'bold';
            comboElement.style.textShadow = '0 0 10px rgba(255,255,255,0.8)';
            comboElement.style.zIndex = '100';
            comboElement.style.opacity = '1';
            comboElement.style.transition = 'opacity 0.8s, transform 0.8s';
            
            // 添加到游戏区域
            this.canvas.parentElement.style.position = 'relative';
            this.canvas.parentElement.appendChild(comboElement);
            
            // 动画效果并移除
            setTimeout(() => {
                comboElement.style.opacity = '0';
                comboElement.style.transform = 'translate(-50%, -100%)';
                setTimeout(() => {
                    comboElement.remove();
                }, 800);
            }, 100);
        }
    }
    
    /**
     * 根据清除的行数更新分数
     */
    updateScoreForLines(linesCleared, comboBonus = 0) {
        let lineScore = 0;
        
        switch (linesCleared) {
            case 1:
                lineScore = SCORING.SINGLE * this.level;
                break;
            case 2:
                lineScore = SCORING.DOUBLE * this.level;
                break;
            case 3:
                lineScore = SCORING.TRIPLE * this.level;
                break;
            case 4:
                lineScore = SCORING.TETRIS * this.level;
                // Tetris清除也给特殊奖励
                this.triggerSpecialEffect('speed_boost');
                break;
        }
        
        // 应用连击奖励
        this.score += lineScore + comboBonus;
        
        // 如果有连击奖励，显示
        if (comboBonus > 0) {
            this.showScorePopup(comboBonus);
        }
    }
    
    /**
     * 显示分数弹出信息
     */
    showScorePopup(score) {
        const scoreElement = document.createElement('div');
        scoreElement.className = 'score-popup';
        scoreElement.textContent = `+${score}`;
        
        // 样式设置
        scoreElement.style.position = 'absolute';
        scoreElement.style.top = '40%';
        scoreElement.style.left = '50%';
        scoreElement.style.transform = 'translate(-50%, -50%)';
        scoreElement.style.color = '#FFD700'; // 金色
        scoreElement.style.fontSize = '24px';
        scoreElement.style.fontWeight = 'bold';
        scoreElement.style.zIndex = '100';
        scoreElement.style.opacity = '1';
        scoreElement.style.transition = 'opacity 1s, transform 1s';
        
        // 添加到游戏区域
        this.canvas.parentElement.style.position = 'relative';
        this.canvas.parentElement.appendChild(scoreElement);
        
        // 动画效果并移除
        setTimeout(() => {
            scoreElement.style.opacity = '0';
            scoreElement.style.transform = 'translate(-50%, -150%)';
            setTimeout(() => {
                scoreElement.remove();
            }, 1000);
        }, 100);
    }
    
    /**
     * 检查是否触发特殊效果
     */
    checkSpecialEffects(linesCleared) {
        // 每清除10行有几率触发特殊效果
        if (this.lines % 10 === 0 && this.lines > 0) {
            const effectChance = 0.7; // 70%几率触发特殊效果
            
            if (Math.random() < effectChance) {
                const effects = ['speed_boost', 'slow_motion', 'clear_bottom'];
                const randomEffect = effects[Math.floor(Math.random() * effects.length)];
                this.triggerSpecialEffect(randomEffect);
            }
        }
        
        // Tetris清除(4行)总是给特殊奖励
        if (linesCleared === 4) {
            // 这部分在updateScoreForLines中已处理
        }
    }
    
    /**
     * 触发特殊效果
     */
    triggerSpecialEffect(effectType) {
        // 如果已有效果激活，不重复触发
        if (this.specialEffects.active) return;
        
        this.specialEffects.active = true;
        this.specialEffects.type = effectType;
        this.specialEffects.startTime = Date.now();
        
        switch (effectType) {
            case 'speed_boost':
                // 速度提升效果（5秒）
                this.specialEffects.duration = 5000;
                this.gameSpeed = this.gameSpeed / 2; // 速度翻倍
                this.showEffectNotification('速度提升！', 'orange');
                break;
                
            case 'slow_motion':
                // 慢动作效果（8秒）
                this.specialEffects.duration = 8000;
                this.gameSpeed = this.gameSpeed * 1.5; // 速度减慢
                this.showEffectNotification('慢动作模式！', 'blue');
                break;
                
            case 'clear_bottom':
                // 清除底部2行
                this.clearBottomRows(2);
                this.specialEffects.active = false; // 立即结束效果
                this.showEffectNotification('底部清除！', 'green');
                break;
        }
    }
    
    /**
     * 显示效果通知
     */
    showEffectNotification(message, color) {
        const effectElement = document.createElement('div');
        effectElement.className = 'effect-notification';
        effectElement.textContent = message;
        
        // 样式设置
        effectElement.style.position = 'absolute';
        effectElement.style.top = '20%';
        effectElement.style.left = '50%';
        effectElement.style.transform = 'translate(-50%, -50%) scale(1.2)';
        effectElement.style.color = color;
        effectElement.style.fontSize = '28px';
        effectElement.style.fontWeight = 'bold';
        effectElement.style.textShadow = '0 0 15px rgba(255,255,255,0.8)';
        effectElement.style.zIndex = '100';
        effectElement.style.opacity = '1';
        effectElement.style.transition = 'opacity 0.8s, transform 0.8s';
        
        // 添加到游戏区域
        this.canvas.parentElement.style.position = 'relative';
        this.canvas.parentElement.appendChild(effectElement);
        
        // 动画效果并移除
        setTimeout(() => {
            effectElement.style.opacity = '0';
            effectElement.style.transform = 'translate(-50%, -100%) scale(0.8)';
            setTimeout(() => {
                effectElement.remove();
            }, 800);
        }, 1500);
    }
    
    /**
     * 清除底部行
     */
    clearBottomRows(count) {
        // 从底部删除指定数量的行
        for (let i = 0; i < count; i++) {
            if (ROWS - 1 - i >= 0) {
                this.board.splice(ROWS - 1 - i, 1);
                this.board.unshift(Array(COLS).fill(0));
            }
        }
        
        // 加分
        this.score += count * 100 * this.level;
        this.updateScore();
        
        // 播放清除音效
        if (this.settings.sound) {
            this.sounds.clear.currentTime = 0;
            this.sounds.clear.play().catch(() => {});
        }
    }
    
    /**
     * 检查是否升级
     */
    checkLevelUp() {
        const difficultySettings = this.getDifficultySettings();
        const newLevel = Math.floor(this.lines / difficultySettings.linesPerLevel) + 1;
        
        if (newLevel > this.level) {
            this.level = newLevel;
            this.gameSpeed = this.getSpeedForLevel();
        }
    }
    
    /**
     * 获取当前难度的设置
     */
    getDifficultySettings() {
        switch (this.settings.difficulty) {
            case 'easy':
                return DIFFICULTY_LEVELS.EASY;
            case 'hard':
                return DIFFICULTY_LEVELS.HARD;
            default:
                return DIFFICULTY_LEVELS.MEDIUM;
        }
    }
    
    /**
     * 获取当前等级的游戏速度
     */
    getSpeedForLevel() {
        const difficultySettings = this.getDifficultySettings();
        return Math.max(100, difficultySettings.initialSpeed - (this.level - 1) * difficultySettings.speedDecrement);
    }
    
    /**
     * 生成新方块
     */
    generateNewPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = getRandomTetromino();
    }
    
    /**
     * 更新分数显示
     */
    updateScore() {
        document.getElementById('score-value').textContent = this.score;
        document.getElementById('level-value').textContent = this.level;
        document.getElementById('lines-value').textContent = this.lines;
        
        // 如果UI中有连击显示，也更新它
        if (document.getElementById('combo-value')) {
            document.getElementById('combo-value').textContent = this.combo;
        }
    }
    
    /**
     * 保存高分
     */
    saveHighScore() {
        let highScores = JSON.parse(localStorage.getItem(STORAGE_KEYS.HIGH_SCORES) || '[]');
        
        // 添加新分数
        const newScore = {
            name: '玩家',  // 可以在游戏结束时让玩家输入名字
            score: this.score,
            date: new Date().toISOString()
        };
        
        highScores.push(newScore);
        
        // 按分数排序
        highScores.sort((a, b) => b.score - a.score);
        
        // 只保留前10名
        highScores = highScores.slice(0, 10);
        
        // 保存到本地存储
        localStorage.setItem(STORAGE_KEYS.HIGH_SCORES, JSON.stringify(highScores));
    }
    
    /**
     * 游戏主循环
     */
    update(time = 0) {
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        // 检查特殊效果是否结束
        if (this.specialEffects.active) {
            const effectElapsed = Date.now() - this.specialEffects.startTime;
            if (effectElapsed > this.specialEffects.duration) {
                // 重置游戏速度
                this.gameSpeed = this.getSpeedForLevel();
                this.specialEffects.active = false;
            }
        }
        
        this.dropCounter += deltaTime;
        if (this.dropCounter > this.gameSpeed) {
            this.movePiece(DIRECTIONS.DOWN);
            this.dropCounter = 0;
        }
        
        this.draw();
        this.animationId = requestAnimationFrame((time) => this.update(time));
    }
    
    /**
     * 绘制游戏
     */
    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.nextPieceCtx.clearRect(0, 0, this.nextPieceCanvas.width, this.nextPieceCanvas.height);
        
        // 绘制游戏背景
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--current-game-bg');
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制游戏背景网格
        this.drawGrid();
        
        // 绘制已落下的方块
        this.drawBoard();
        
        // 绘制当前方块
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece, this.ctx);
        }
        
        // 绘制下一个方块预览
        if (this.nextPiece) {
            this.drawNextPiece();
        }
    }
    
    /**
     * 绘制网格
     */
    drawGrid() {
        const blockSize = this.getBlockSize();
        const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--grid-color').trim();
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 0.5;
        
        // 绘制水平线
        for (let i = 0; i <= ROWS; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * blockSize);
            this.ctx.lineTo(this.canvas.width, i * blockSize);
            this.ctx.stroke();
        }
        
        // 绘制垂直线
        for (let i = 0; i <= COLS; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * blockSize, 0);
            this.ctx.lineTo(i * blockSize, this.canvas.height);
            this.ctx.stroke();
        }
    }
    
    /**
     * 创建网格背景图案
     */
    createGridPattern(blockSize) {
        // 不再创建会覆盖背景的图案
        return null;
    }
    
    /**
     * 绘制游戏板
     */
    drawBoard() {
        const blockSize = this.getBlockSize();
        
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.board[y][x]) {
                    const drawX = x * blockSize;
                    const drawY = y * blockSize;
                    
                    // 获取方块颜色
                    let blockInfo = this.board[y][x];
                    let colorValue;
                    
                    if (typeof blockInfo === 'object' && blockInfo.color) {
                        // 如果是对象格式，使用color属性
                        colorValue = blockInfo.color;
                    } else {
                        // 向后兼容之前的格式
                        colorValue = blockInfo;
                    }
                    
                    // 如果是CSS变量引用，获取实际颜色值
                    if (typeof colorValue === 'string' && colorValue.startsWith('var(')) {
                        try {
                            colorValue = getComputedStyle(document.documentElement).getPropertyValue(
                                colorValue.substring(4, colorValue.length-1)
                            );
                        } catch (error) {
                            // 如果获取CSS变量失败，使用默认颜色
                            colorValue = '#aaaaaa';
                        }
                    }
                    
                    // 绘制方块主体
                    this.ctx.fillStyle = colorValue || '#aaaaaa';
                    this.ctx.fillRect(drawX, drawY, blockSize, blockSize);
                    
                    // 绘制方块内部渐变
                    const gradient = this.ctx.createLinearGradient(
                        drawX, drawY, 
                        drawX + blockSize, drawY + blockSize
                    );
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
                    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
                    this.ctx.fillStyle = gradient;
                    this.ctx.fillRect(drawX, drawY, blockSize, blockSize);
                    
                    // 绘制方块边框
                    this.ctx.strokeStyle = 'var(--block-border)';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(drawX, drawY, blockSize, blockSize);
                    
                    // 绘制方块高光
                    this.ctx.fillStyle = 'var(--block-highlight)';
                    this.ctx.beginPath();
                    this.ctx.moveTo(drawX, drawY);
                    this.ctx.lineTo(drawX + blockSize, drawY);
                    this.ctx.lineTo(drawX + blockSize * 0.8, drawY + blockSize * 0.2);
                    this.ctx.lineTo(drawX + blockSize * 0.2, drawY + blockSize * 0.2);
                    this.ctx.lineTo(drawX, drawY);
                    this.ctx.fill();
                    
                    // 绘制方块阴影
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                    this.ctx.beginPath();
                    this.ctx.moveTo(drawX + blockSize, drawY);
                    this.ctx.lineTo(drawX + blockSize, drawY + blockSize);
                    this.ctx.lineTo(drawX, drawY + blockSize);
                    this.ctx.lineTo(drawX + blockSize * 0.2, drawY + blockSize * 0.8);
                    this.ctx.lineTo(drawX + blockSize * 0.8, drawY + blockSize * 0.8);
                    this.ctx.lineTo(drawX + blockSize, drawY);
                    this.ctx.fill();
                }
            }
        }
    }
    
    /**
     * 绘制方块
     */
    drawPiece(piece, context, offsetX = 0, offsetY = 0) {
        const { shape, color, specialRender, type } = piece;
        const blockSize = context === this.ctx ? this.getBlockSize() : 30;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const drawX = (piece.x + x + offsetX) * blockSize;
                    const drawY = (piece.y + y + offsetY) * blockSize;
                    
                    // 获取实际颜色值
                    let colorValue = color;
                    
                    // 处理特殊渲染方块
                    if (specialRender) {
                        if (type === 'R') {
                            // 彩虹方块用渐变色
                            const gradient = context.createLinearGradient(
                                drawX, drawY, drawX + blockSize, drawY + blockSize);
                            gradient.addColorStop(0, 'red');
                            gradient.addColorStop(0.2, 'orange');
                            gradient.addColorStop(0.4, 'yellow');
                            gradient.addColorStop(0.6, 'green');
                            gradient.addColorStop(0.8, 'blue');
                            gradient.addColorStop(1, 'purple');
                            colorValue = gradient;
                        }
                    } else if (colorValue.startsWith('var(')) {
                        // 如果是CSS变量引用，获取实际颜色值
                        try {
                            colorValue = getComputedStyle(document.documentElement).getPropertyValue(
                                colorValue.substring(4, colorValue.length-1)
                            );
                        } catch (error) {
                            // 如果获取CSS变量失败，使用默认颜色
                            colorValue = '#aaaaaa';
                        }
                    }
                    
                    // 绘制方块主体
                    context.fillStyle = colorValue;
                    context.fillRect(drawX, drawY, blockSize, blockSize);
                    
                    // 为炸弹方块添加特殊效果
                    if (type === 'B') {
                        // 画炸弹图案
                        context.fillStyle = 'rgba(255, 255, 255, 0.8)';
                        context.beginPath();
                        context.arc(
                            drawX + blockSize / 2, 
                            drawY + blockSize / 2, 
                            blockSize / 4, 
                            0, Math.PI * 2
                        );
                        context.fill();
                        
                        // 添加闪烁效果
                        if (Math.random() > 0.7) {
                            context.fillStyle = 'rgba(255, 255, 255, 0.9)';
                            context.beginPath();
                            context.arc(
                                drawX + blockSize / 2, 
                                drawY + blockSize / 2, 
                                blockSize / 3, 
                                0, Math.PI * 2
                            );
                            context.fill();
                        }
                    }
                    
                    // 绘制方块内部渐变 - 不为彩虹方块添加额外渐变
                    if (type !== 'R') {
                        const gradient = context.createLinearGradient(
                            drawX, drawY, 
                            drawX + blockSize, drawY + blockSize
                        );
                        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
                        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
                        context.fillStyle = gradient;
                        context.fillRect(drawX, drawY, blockSize, blockSize);
                    }
                    
                    // 绘制方块边框
                    context.strokeStyle = 'var(--block-border)';
                    context.lineWidth = 1;
                    context.strokeRect(drawX, drawY, blockSize, blockSize);
                    
                    // 绘制方块高光
                    context.fillStyle = 'var(--block-highlight)';
                    context.beginPath();
                    context.moveTo(drawX, drawY);
                    context.lineTo(drawX + blockSize, drawY);
                    context.lineTo(drawX + blockSize * 0.8, drawY + blockSize * 0.2);
                    context.lineTo(drawX + blockSize * 0.2, drawY + blockSize * 0.2);
                    context.lineTo(drawX, drawY);
                    context.fill();
                    
                    // 绘制方块阴影
                    context.fillStyle = 'rgba(0, 0, 0, 0.2)';
                    context.beginPath();
                    context.moveTo(drawX + blockSize, drawY);
                    context.lineTo(drawX + blockSize, drawY + blockSize);
                    context.lineTo(drawX, drawY + blockSize);
                    context.lineTo(drawX + blockSize * 0.2, drawY + blockSize * 0.8);
                    context.lineTo(drawX + blockSize * 0.8, drawY + blockSize * 0.8);
                    context.lineTo(drawX + blockSize, drawY);
                    context.fill();
                }
            }
        }
    }
    
    /**
     * 绘制下一个方块预览
     */
    drawNextPiece() {
        const { shape } = this.nextPiece;
        const blockSize = 30;
        
        // 计算居中位置
        const size = getTrueSize(shape);
        const offsetX = (4 - size.cols) / 2;
        const offsetY = (4 - size.rows) / 2;
        
        // 绘制预览背景
        this.nextPieceCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--current-game-bg');
        this.nextPieceCtx.fillRect(0, 0, this.nextPieceCanvas.width, this.nextPieceCanvas.height);
        
        // 创建临时方块对象用于绘制
        const tempPiece = {
            ...this.nextPiece,
            x: offsetX,
            y: offsetY
        };
        
        this.drawPiece(tempPiece, this.nextPieceCtx);
    }
    
    /**
     * 移动方块
     */
    movePiece(direction) {
        const originalX = this.currentPiece.x;
        const originalY = this.currentPiece.y;
        
        switch (direction) {
            case DIRECTIONS.LEFT:
                this.currentPiece.x--;
                if (this.checkCollision()) {
                    this.currentPiece.x++;
                } else if (this.settings.sound) {
                    this.sounds.move.currentTime = 0;
                    this.sounds.move.play().catch(() => {});
                }
                break;
                
            case DIRECTIONS.RIGHT:
                this.currentPiece.x++;
                if (this.checkCollision()) {
                    this.currentPiece.x--;
                } else if (this.settings.sound) {
                    this.sounds.move.currentTime = 0;
                    this.sounds.move.play().catch(() => {});
                }
                break;
                
            case DIRECTIONS.DOWN:
                this.currentPiece.y++;
                if (this.checkCollision()) {
                    this.currentPiece.y--;
                    this.lockPiece();
                    this.clearLines();
                    this.generateNewPiece();
                } else {
                    // 软降得分
                    this.score += SCORING.SOFT_DROP;
                    this.updateScore();
                }
                break;
        }
        
        // 如果方块位置有变化，重新绘制
        if (originalX !== this.currentPiece.x || originalY !== this.currentPiece.y) {
            this.draw();
        }
    }
    
    /**
     * 旋转方块
     */
    rotatePiece() {
        const originalShape = this.currentPiece.shape;
        
        // 保存原始旋转状态
        const originalRotation = this.currentPiece.rotation;
        
        // 旋转方块
        this.currentPiece.shape = rotateMatrix(this.currentPiece.shape);
        this.currentPiece.rotation = (this.currentPiece.rotation + 1) % 4;
        
        // 检查碰撞并尝试墙踢
        if (this.checkCollision()) {
            // 尝试向左移动（墙踢）
            this.currentPiece.x--;
            if (this.checkCollision()) {
                // 尝试向右移动（墙踢）
                this.currentPiece.x += 2;
                if (this.checkCollision()) {
                    // 尝试向上移动（底部踢）
                    this.currentPiece.x--;
                    this.currentPiece.y--;
                    if (this.checkCollision()) {
                        // 如果所有尝试都失败，恢复原始状态
                        this.currentPiece.y++;
                        this.currentPiece.shape = originalShape;
                        this.currentPiece.rotation = originalRotation;
                        return;
                    }
                }
            }
        }
        
        // 播放旋转音效
        if (this.settings.sound) {
            this.sounds.rotate.currentTime = 0;
            this.sounds.rotate.play().catch(() => {});
        }
        
        this.draw();
    }
    
    /**
     * 硬降（快速下落到底部）
     */
    hardDrop() {
        let dropDistance = 0;
        
        // 下落直到碰撞
        while (!this.checkCollision()) {
            this.currentPiece.y++;
            dropDistance++;
        }
        
        // 回退一步（因为最后一步是碰撞的）
        this.currentPiece.y--;
        dropDistance--;
        
        // 硬降得分
        this.score += dropDistance * SCORING.HARD_DROP;
        this.updateScore();
        
        // 播放下落音效
        if (this.settings.sound) {
            this.sounds.drop.currentTime = 0;
            this.sounds.drop.play().catch(() => {});
        }
        
        // 锁定方块并生成新方块
        this.lockPiece();
        this.clearLines();
        this.generateNewPiece();
        
        this.draw();
    }
    
    /**
     * 检查碰撞
     */
    checkCollision() {
        const { shape, x, y } = this.currentPiece;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardX = x + col;
                    const boardY = y + row;
                    
                    // 检查是否超出边界
                    if (
                        boardX < 0 || 
                        boardX >= COLS || 
                        boardY >= ROWS ||
                        // 检查是否与已有方块重叠
                        (boardY >= 0 && this.board[boardY][boardX])
                    ) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
} 