import { _decorator, Component, easing, instantiate, Node, Prefab } from 'cc';
import { Core, GameStatus } from '../Core';
import { Cell } from './Cell';
const { ccclass, property } = _decorator;

/**
 * 列状态枚举
 */
export enum ColumnStatus {
    /** 准备状态 */
    Ready = 'Ready',
    /** 启动状态（上移一定偏移量） */
    StartUp = 'StartUp',
    /** 持续旋转状态 */
    Spinning = 'Spinning',
    /** 往目标转停状态 */
    SpinningToStop = 'SpinningToStop',
    /** 结束前重置状态 */
    EndReset = 'EndReset',
    /** 结束状态（上移一定偏移量） */
    EndUp = 'EndUp',
    /** 目标停止状态 */
    Stop = 'Stop'
}
@ccclass('Column')
export class Column extends Component {
    /** 列序号 */
    index: number = 0;
    /** 每列内的cell类型数组 */
    types: number[] = [];
    /** 当前状态 */
    _status: ColumnStatus = ColumnStatus.Ready;
    /** 经历的时间 */
    pass_time: number = 0;
    /** 结果数组 */
    result: number[] = [];
    /** 结果索引 */
    result_index: number = 0;
    /** 当前列启动延迟 */
    static currStartDelay: number = 0;
    /** 停止转动持续时间 */
    spinning_to_stop_duration: number = 1;
    /** 结束向上移动持续时间 */
    end_up_duration: number = .1;
    /**
     * 设置列状态
     */

    set status(value: ColumnStatus) {
        console.log(`【Column ${this.index} status changed to ${value}】`);
        this.pass_time = 0;
        this._status = value;
    }
    get status() {
        return this._status;
    }
    start() {

    }
    /** 启动向上移动持续时间 */
    start_up_duration: number = 0.2;
    /** 启动向上偏移距离 */
    start_up_distance: number = 30;
    /** 持续转动速度 */
    spinning_speed: number = 1000;
    init(index: number, types: number[], cell_prefab: Prefab) {
        this.index = index;
        this.types = types;
        for (let i = 0; i < Core.RowCount; i++) {
            const cell = instantiate(cell_prefab);
            const type = types[i];
            cell.parent = this.node;
            // cell.getComponent(Cell).refreshSymbol(i, type, Core.ClearSymbols[type]);
            cell.setPosition(0, i * Core.CellHeight);
        }
        this.status = ColumnStatus.Ready;
    }
    /** 转停距离 */
    spinning_to_stop_distance: number = 0;
    /** 两次小距离偏移启动位置（开始向上一小段和结尾向上一小段） */
    offset_start_pos_y: number = 0;

    /** 转停偏移距离，额外的偏移距离，用于创造过冲效果 */
    spinning_to_stop_offset_distance: number = 20;
    /**
  * 设置每一列的结果
  * @param result 结果数组
  */
    async spinningToStop(result: number[]) {
        this.result = result;
        // 加延迟有个先后转停的效果
        await Core.sleep(Core.currStartDelay * this.index);
        // 计算到结果需要偏移的距离
        let min_y = Number.MAX_VALUE;
        this.node.children.forEach((cell_node: Node) => {
            const cell_pos_y = cell_node.getPosition().y;
            if (cell_pos_y < min_y) {
                min_y = cell_pos_y;
            }
        })
        this.spinning_to_stop_distance =
            Core.CellHeight + (this.node.getPosition().y + min_y) + Core.CellHeight * (Core.RowCount - 1) + this.spinning_to_stop_offset_distance;
        this.offset_start_pos_y = this.node.getPosition().y;
        this.status = ColumnStatus.SpinningToStop;
    }

    /**
     * 开始转动
     */
    async startSpin() {
        //根据列号设置延迟,有先后开始滚动的效果
        await Core.sleep(Core.currStartDelay * this.index);
        this.status = ColumnStatus.StartUp;
        //设置成模糊素材
        // this.node.children.forEach((cell_node: Node) => {
        //     const cell = cell_node.getComponent(Cell);
        //     cell.setSymbol(Core.BlurSymbols[cell.type]);
        // });
    }
    update(deltaTime: number) {
        if (this.status === ColumnStatus.StartUp) {
            this.pass_time += deltaTime;
            let t = this.pass_time;
            if (t >= this.start_up_duration) {
                t = this.start_up_duration;
                this.status = ColumnStatus.Spinning;
            }
            const offset_distance = (t / this.start_up_duration) * this.start_up_distance;
            this.node.setPosition(this.node.getPosition().x, offset_distance);
        }
        // 持续向下滚动
        if (this.status === ColumnStatus.Spinning) {
            this.pass_time += deltaTime;
            const spin_distance = this.pass_time * this.spinning_speed;
            this.node.setPosition(this.node.getPosition().x, this.start_up_distance - spin_distance);
            this.dealOutCell();
        }
        // 转动到结果
        if (this.status === ColumnStatus.SpinningToStop) {
            this.pass_time += deltaTime;
            let t = this.pass_time;
            if (t >= this.spinning_to_stop_duration) {
                t = this.spinning_to_stop_duration;
                this.status = ColumnStatus.EndReset;
            }
            const move_t = easing.sineOut(t / this.spinning_to_stop_duration);
            const offset_distance = move_t * this.spinning_to_stop_distance;
            this.node.setPosition(this.node.getPosition().x, this.offset_start_pos_y - offset_distance);
            this.dealOutCell(this.result);
        }
        // 结束向上一段偏移（看起来有弹性效果）
        if (this.status === ColumnStatus.EndUp) {
            this.pass_time += deltaTime;
            let t = this.pass_time;
            if (t >= this.end_up_duration) {
                t = this.end_up_duration;
                this.status = ColumnStatus.Ready;
                if (this.index == Core.ColumnCount - 1) {
                    //最后一列转动结束，游戏进入结算状态
                    Core.game_status = GameStatus.Settle;
                }
            }
            const offset_distance = (t / this.end_up_duration) * this.spinning_to_stop_offset_distance;
            this.node.setPosition(this.node.getPosition().x, this.offset_start_pos_y + offset_distance);
        }
        // 滚动节点的位置重置
        if (this.status === ColumnStatus.EndReset) {
            this.readyEndUp();
            this.status = ColumnStatus.EndUp;
        }
    }
    /**
   * 列复位
   */
    readyEndUp() {
        this.node.children.forEach((cell_node: Node, index: number) => {
            // const cell = cell_node.getComponent(Cell);
            // const type = this.result[index];
            // cell.refreshSymbol(index, type, Core.ClearSymbols[type]);
            cell_node.setPosition(0, index * Core.CellHeight);
        });
        this.offset_start_pos_y = -this.spinning_to_stop_offset_distance;
        this.node.setPosition(this.node.getPosition().x, this.offset_start_pos_y);
        this.result_index = 0;
    }
    /**
   * 处理出界的cell
   * @param result 结果数组
   */
    dealOutCell(result: number[] = null) {
        this.node.children.forEach((cell_node: Node) => {
            // const cell = cell_node.getComponent(Cell);
            //cell相对于Map的位置
            const cell_pos_y = this.node.getPosition().y + cell_node.getPosition().y;
            // cell 出界设置到最上面，达到循环滚动效果
            if (cell_pos_y < -Core.CellHeight) {
                cell_node.setPosition(cell_node.getPosition().x, cell_node.getPosition().y + Core.CellHeight * Core.RowCount);
                //有结果时，设置cell的符号为结果 否则设置随机符号
                // const type = result ? result[this.result_index++] : Core.getRndType();
                // cell.setSymbol(Core.BlurSymbols[type]);
            }
        });
    }
}


