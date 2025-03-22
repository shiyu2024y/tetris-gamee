/**
 * 游戏主入口文件
 * 初始化游戏和UI
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
    // 获取游戏画布
    const gameCanvas = document.getElementById('game-canvas');
    const nextPieceCanvas = document.getElementById('next-piece-canvas');
    
    // 创建游戏实例
    const game = new TetrisGame(gameCanvas, nextPieceCanvas);
    
    // 初始化UI
    initUI(game);
    
    // 添加触摸滑动控制（适配移动设备）
    setupTouchControls(gameCanvas, game);
});

/**
 * 设置触摸控制
 * @param {HTMLElement} element 要添加触摸控制的元素
 * @param {TetrisGame} game 游戏实例
 */
function setupTouchControls(element, game) {
    let startX, startY;
    let touchStartTime;
    
    // 触摸开始
    element.addEventListener('touchstart', (e) => {
        if (game.state !== GAME_STATES.PLAYING) return;
        
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        touchStartTime = Date.now();
    });
    
    // 触摸结束
    element.addEventListener('touchend', (e) => {
        if (game.state !== GAME_STATES.PLAYING) return;
        
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const touchEndTime = Date.now();
        
        const diffX = endX - startX;
        const diffY = endY - startY;
        const touchDuration = touchEndTime - touchStartTime;
        
        // 判断是点击还是滑动
        if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10 && touchDuration < 300) {
            // 点击 - 旋转方块
            game.rotatePiece();
        } else {
            // 滑动
            const absX = Math.abs(diffX);
            const absY = Math.abs(diffY);
            
            // 判断滑动方向
            if (absX > absY) {
                // 水平滑动
                if (diffX > 0) {
                    // 向右滑动
                    game.movePiece(DIRECTIONS.RIGHT);
                } else {
                    // 向左滑动
                    game.movePiece(DIRECTIONS.LEFT);
                }
            } else {
                // 垂直滑动
                if (diffY > 0) {
                    // 向下滑动 - 加速下落
                    game.movePiece(DIRECTIONS.DOWN);
                } else {
                    // 向上滑动 - 硬降（快速下落到底部）
                    game.hardDrop();
                }
            }
        }
    });
    
    // 阻止默认的触摸行为（如滚动）
    element.addEventListener('touchmove', (e) => {
        if (game.state === GAME_STATES.PLAYING) {
            e.preventDefault();
        }
    }, { passive: false });
} 