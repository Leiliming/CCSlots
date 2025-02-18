import { Game } from "./Game";

/**
 * 游戏状态枚举
 */
export enum GameStatus {
    /** 准备状态 */
    Ready = 'Ready',
    /** 结果请求状态 */
    Request = 'Request',
    /** 结果展示状态（拿到结果滚动到目标为止） */
    Result = 'Result',
    /** 结算状态 */
    Settle = 'Settle',
    /** 消除状态 */
    Removing = 'Removing',
    /** 填充状态 */
    Filling = 'Filling',
}
export class Core {
    /** 地图宽度 */
    static MapWidth: number = 859;
    /** 地图高度 */
    static MapHeight: number = 446;

    /** 列宽 */
    static ColumnWidth: number = 143;

    /** 列数量 */
    static ColumnCount: number = 6;
    /** 行数量（屏幕外多加一行保证循环滚动） */
    static RowCount: number = 4;

    /** 单个格子宽度 */
    static CellWidth: number = 143;
    /** 单个格子高度 */
    static CellHeight: number = 143;
    /** 请求延迟时间（单位：秒） */
    static requestDelay: number = 3;
    /** 当前游戏状态 */
    static _game_status: GameStatus = GameStatus.Ready;
    /**
    * 获取当前游戏状态
    */

    /** 结果数据 */
    static result: number[][] = [];
    static get game_status(): GameStatus {
        return Core._game_status;
    }
    /**
   * 设置游戏状态
   * @param value 要设置的游戏状态
   */
    static set game_status(value: GameStatus) {
        console.log('【GameStatus change to >>', value, '】');
        Core._game_status = value;
        // 进入结算状态
        if (value == GameStatus.Settle) {
            // 这里可以调用相关的接口处理结算内容
            // ...
            // 结算完成后进入 Ready 状态
            Core.game_status = GameStatus.Ready;
        }
        // 进入填充状态
        if (value == GameStatus.Filling) {
            // Game.Main.fill();
        }
    }

    /** 当前列启动延迟 */
    static currStartDelay: number = 0.2;
    // /**
    //  * 获取随机图形类型（0-7）
    //  */
    // static getRndType(): SymbolType {
    //     return Core.SymbolPool[Math.floor(Math.random() * Core.SymbolPool.length)];
    // }
    /**
     * 休眠函数
     * @param time 休眠时间（单位：秒）
     */
    static sleep(time: number) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(1);
            }, time * 1000)
        });
    }

}


