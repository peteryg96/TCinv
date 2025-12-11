const { syncInventory, updatePlatformStock } = require('../services/syncService');

jest.mock('../services/shopeeService');
jest.mock('../services/lazadaService');
jest.mock('../services/tiktokService');

describe('Sync Service', () => {
  describe('syncInventory', () => {
    it('should sync inventory across all platforms', async () => {
      const productId = 'test-product-id';
      const newStock = 100;

      const result = await syncInventory(productId, newStock);

      expect(result.success).toBe(true);
      expect(result.platforms).toHaveProperty('shopee');
      expect(result.platforms).toHaveProperty('lazada');
      expect(result.platforms).toHaveProperty('tiktok');
    });

    it('should handle partial sync failures gracefully', async () => {
      // Test when one platform fails
      const productId = 'test-product-id';
      const newStock = 50;

      // Mock one platform to fail
      jest.spyOn(require('../services/shopeeService'), 'updateStock')
        .mockRejectedValueOnce(new Error('API Error'));

      const result = await syncInventory(productId, newStock);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });
});