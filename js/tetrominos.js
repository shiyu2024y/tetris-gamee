/**
 * 俄罗斯方块形状定义
 * 每个方块由一个4x4的矩阵表示，1表示有方块，0表示无方块
 */

const TETROMINOS = {
    // I形方块 - 青色
    I: {
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: 'var(--i-block-color)'
    },
    
    // J形方块 - 蓝色
    J: {
        shape: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: 'var(--j-block-color)'
    },
    
    // L形方块 - 橙色
    L: {
        shape: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: 'var(--l-block-color)'
    },
    
    // O形方块 - 黄色
    O: {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: 'var(--o-block-color)'
    },
    
    // S形方块 - 绿色
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        color: 'var(--s-block-color)'
    },
    
    // T形方块 - 紫色
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: 'var(--t-block-color)'
    },
    
    // Z形方块 - 红色
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        color: 'var(--z-block-color)'
    },
    
    // 特殊方块 - 彩虹方块
    R: {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: 'rainbow-gradient',
        isSpecial: true,
        effect: 'rainbow'
    },
    
    // 特殊方块 - 炸弹方块
    B: {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 1, 0]
        ],
        color: '#FF4500', // 亮红色
        isSpecial: true,
        effect: 'bomb'
    }
};

/**
 * 随机生成一个方块
 * @returns {Object} 返回一个随机的方块对象
 */
function getRandomTetromino() {
    // 标准方块类型
    const standardTypes = 'IJLOSTZ';
    
    // 特殊方块出现概率（10%）
    const specialChance = 0.1;
    
    // 决定是否生成特殊方块
    if (Math.random() < specialChance) {
        // 特殊方块类型
        const specialTypes = 'RB';
        const randomType = specialTypes.charAt(Math.floor(Math.random() * specialTypes.length));
        return createTetromino(randomType);
    } else {
        // 生成标准方块
        const randomType = standardTypes.charAt(Math.floor(Math.random() * standardTypes.length));
        return createTetromino(randomType);
    }
}

/**
 * 创建指定类型的方块对象
 * @param {string} type 方块类型
 * @returns {Object} 方块对象
 */
function createTetromino(type) {
    const tetromino = {
        type: type,
        ...TETROMINOS[type],
        x: type === 'O' ? 4 : 3,  // O形方块居中位置不同
        y: 0,
        rotation: 0
    };
    
    // 特殊处理彩虹方块
    if (type === 'R') {
        // 彩虹方块使用动态生成的渐变色
        tetromino.specialRender = true;
    }
    
    return tetromino;
}

/**
 * 旋转方块
 * @param {Array} matrix 方块矩阵
 * @returns {Array} 旋转后的方块矩阵
 */
function rotateMatrix(matrix) {
    // 转置矩阵
    const N = matrix.length;
    const result = Array.from({ length: N }, () => Array(N).fill(0));
    
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            result[j][N - 1 - i] = matrix[i][j];
        }
    }
    
    return result;
}

/**
 * 获取方块的实际占用空间（去除周围的空行和空列）
 * @param {Array} matrix 方块矩阵
 * @returns {Object} 包含实际占用的行数和列数
 */
function getTrueSize(matrix) {
    let minRow = matrix.length;
    let maxRow = 0;
    let minCol = matrix[0].length;
    let maxCol = 0;
    
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j]) {
                minRow = Math.min(minRow, i);
                maxRow = Math.max(maxRow, i);
                minCol = Math.min(minCol, j);
                maxCol = Math.max(maxCol, j);
            }
        }
    }
    
    return {
        rows: maxRow - minRow + 1,
        cols: maxCol - minCol + 1
    };
} 