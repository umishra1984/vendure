import { Test } from '@nestjs/testing';

import { ConfigService } from '../../../config/config.service';
import { MockConfigService } from '../../../config/config.service.mock';
import { MergeOrdersStrategy } from '../../../config/order-merge-strategy/merge-orders-strategy';
import { Order } from '../../../entity/order/order.entity';
import { createOrderFromLines } from '../../../testing/order-test-utils';

import { OrderMerger } from './order-merger';

describe('OrderMerger', () => {
    let orderMerger: OrderMerger;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [OrderMerger, { provide: ConfigService, useClass: MockConfigService }],
        }).compile();
        const mockConfigService = module.get<ConfigService, MockConfigService>(ConfigService);
        mockConfigService.orderMergeOptions = {
            mergeStrategy: new MergeOrdersStrategy(),
        };
        orderMerger = module.get(OrderMerger);
    });

    it('both orders undefined', () => {
        const guestOrder = new Order({ lines: [] });
        const existingOrder = new Order({ lines: [] });

        const result = orderMerger.merge();

        expect(result.order).toBeUndefined();
        expect(result.linesToInsert).toBeUndefined();
        expect(result.orderToDelete).toBeUndefined();
    });

    it('guestOrder undefined', () => {
        const existingOrder = createOrderFromLines([{ lineId: 1, quantity: 2, productVariantId: 100 }]);

        const result = orderMerger.merge(undefined, existingOrder);

        expect(result.order).toBe(existingOrder);
        expect(result.linesToInsert).toBeUndefined();
        expect(result.orderToDelete).toBeUndefined();
    });

    it('existingOrder undefined', () => {
        const guestOrder = createOrderFromLines([{ lineId: 1, quantity: 2, productVariantId: 100 }]);

        const result = orderMerger.merge(guestOrder, undefined);

        expect(result.order).toBe(guestOrder);
        expect(result.linesToInsert).toBeUndefined();
        expect(result.orderToDelete).toBeUndefined();
    });

    it('empty guestOrder', () => {
        const guestOrder = createOrderFromLines([]);
        guestOrder.id = 42;
        const existingOrder = createOrderFromLines([{ lineId: 1, quantity: 2, productVariantId: 100 }]);

        const result = orderMerger.merge(guestOrder, existingOrder);

        expect(result.order).toBe(existingOrder);
        expect(result.linesToInsert).toBeUndefined();
        expect(result.orderToDelete).toBe(guestOrder);
    });

    it('empty existingOrder', () => {
        const guestOrder = createOrderFromLines([{ lineId: 1, quantity: 2, productVariantId: 100 }]);
        const existingOrder = createOrderFromLines([]);
        existingOrder.id = 42;

        const result = orderMerger.merge(guestOrder, existingOrder);

        expect(result.order).toBe(guestOrder);
        expect(result.linesToInsert).toBeUndefined();
        expect(result.orderToDelete).toBe(existingOrder);
    });

    it('new lines added by merge', () => {
        const guestOrder = createOrderFromLines([{ lineId: 20, quantity: 2, productVariantId: 200 }]);
        guestOrder.id = 42;
        const existingOrder = createOrderFromLines([{ lineId: 1, quantity: 2, productVariantId: 100 }]);

        const result = orderMerger.merge(guestOrder, existingOrder);

        expect(result.order).toBe(existingOrder);
        expect(result.linesToInsert).toEqual([{ productVariantId: 200, quantity: 2 }]);
        expect(result.orderToDelete).toBe(guestOrder);
    });
});
