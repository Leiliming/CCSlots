import { _decorator, Component, instantiate, Node, Prefab } from 'cc';
import { Core, GameStatus } from './Core';
import { Column } from './prefabs/Column';
const { ccclass, property } = _decorator;


@ccclass('Game')
export class Game extends Component {
    /**
    * 游戏主实例
    */
    static Main: Game = null;
    /**
         * 列预制体
         */
    @property(Prefab)
    column_prefab: Prefab = null;

    /**
     * 单元格预制体
     */
    @property(Prefab)
    cell_prefab: Prefab = null;

    /**
     * MAP列容器节点
     */
    @property(Node)
    columns: Node = null;
    protected onLoad(): void {
        Game.Main = this;

    }
    /** 模拟请求数据的延迟时间（单位：秒） */
    static requestDelay: number = 2;
    /**
     * 组件启动时调用
     */
    protected start(): void {
        // 初始化游戏地图
        this.initMap();
        // 设置游戏状态为准备状态
        Core.game_status = GameStatus.Ready;
        // 设置当前列开始延迟
        // Core.currStartDelay = Core.ColumnStartDelay;
        // 切换模式
        // this.onMode();
    }
    initMap() {
        // 列起始位置(最左侧,向右依次排开)
        const start_pos_x = -Core.ColumnCount / 2 * Core.ColumnWidth + Core.ColumnWidth / 2;
        // -10 / 2 * 100 + 100 / 2 = 550
        for (let i = 0; i < Core.ColumnCount; i++) {
            const column = instantiate(this.column_prefab);
            const pos_x = start_pos_x + i * Core.ColumnWidth;
            column.setPosition(pos_x, 0);
            column.parent = this.columns;
            // 初始化列类型(随机)
            let types = [];
            // for (let j = 0; j < Core.RowCount; j++) {
            //     types.push(Core.getRndType());
            // }
            column.getComponent(Column).init(i, types, this.cell_prefab);
        }
    }
    /**
    * 处理转动按钮点击
    * 请求结果并控制列的转动
    */
    onSpin() {
        if (Core.game_status != GameStatus.Ready) return;
        Core.game_status = GameStatus.Request;
        // 请求结果
        this.requestResult().then((result) => {
            Core.result = result;
            Core.game_status = GameStatus.Result;
            this.columns.children.forEach((column, index) => {
                column.getComponent(Column).spinningToStop(result[index]);
            });
        });
        // 转动开启
        this.columns.children.forEach((column) => {
            column.getComponent(Column).startSpin();
        });
    }
    /**
      * 模拟请求转动结果
      * 服务器发来的数据是画面内显示的行数，我们需要自己补充顶部外的一行数据
      * @returns Promise<number[][]> 返回转动结果数组
      */
    requestResult(): Promise<number[][]> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // 模拟转动结果
                const result = [];
                // for (let i = 0; i < Core.ColumnCount; i++) {
                //     result[i] = [];
                //     for (let j = 0; j < Core.RowCount; j++) {
                //         // 模拟随机类型 从下往上排列
                //         // result[i][j] = Core.getRndType();
                //         // 模拟固定类型
                //         //result[i][j] = j;
                //     }
                // }
                resolve(result);
            }, Core.requestDelay * 1000);
        })
    }
}


