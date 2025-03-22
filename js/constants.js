/**
 * 游戏常量定义
 */

// 游戏区域大小
const ROWS = 20;
const COLS = 10;

// 游戏状态
const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};

// 游戏难度级别
const DIFFICULTY_LEVELS = {
    EASY: {
        initialSpeed: 1000,  // 初始下落速度（毫秒）
        speedDecrement: 50, // 每级速度减少量
        linesPerLevel: 5   // 每消除多少行升一级
    },
    MEDIUM: {
        initialSpeed: 800,
        speedDecrement: 60,
        linesPerLevel: 10
    },
    HARD: {
        initialSpeed: 500,
        speedDecrement: 70,
        linesPerLevel: 15
    }
};

// 按键代码
const KEY_CODES = {
    LEFT: 37,
    RIGHT: 39,
    DOWN: 40,
    UP: 38,
    SPACE: 32,
    P: 80,
    ESC: 27
};

// 方向
const DIRECTIONS = {
    LEFT: 'left',
    RIGHT: 'right',
    DOWN: 'down'
};

// 旋转方向
const ROTATION = {
    CLOCKWISE: 'clockwise'
};

// 分数系统
const SCORING = {
    SOFT_DROP: 1,      // 软降（加速下落）每格得分
    HARD_DROP: 2,      // 硬降（直接到底）每格得分
    SINGLE: 100,       // 消除1行得分
    DOUBLE: 300,       // 消除2行得分
    TRIPLE: 500,       // 消除3行得分
    TETRIS: 800,       // 消除4行得分
    T_SPIN: 400        // T型方块特殊旋转得分
};

// 主题
const THEMES = {
    CLASSIC: 'classic',
    DARK: 'dark',
    NEON: 'neon'
};

// 本地存储键名
const STORAGE_KEYS = {
    HIGH_SCORES: 'tetris_high_scores',
    SETTINGS: 'tetris_settings',
    ACHIEVEMENTS: 'tetris_achievements',
    STATS: 'tetris_stats'
};

// 默认设置
const DEFAULT_SETTINGS = {
    difficulty: 'medium',
    sound: true,
    music: true,
    theme: 'classic',
    gameBg: 'white',
    blockStyle: 'classic'
}; 