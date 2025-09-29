import { test, expect } from '@playwright/test';

test.describe('Action组件自动化测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/action-test');
    await page.waitForLoadState('networkidle');
  });

  test('页面加载测试', async ({ page }) => {
    // 检查页面标题
    await expect(page).toHaveTitle(/DrPlayer/);
    
    // 检查是否有测试按钮
    const inputButton = page.locator('button').filter({ hasText: '输入框测试' }).first();
    await expect(inputButton).toBeVisible();
    
    console.log('Action Test Page loaded successfully');
  });

  test('基础Action功能测试 - 输入框', async ({ page }) => {
    console.log('开始测试输入框Action...');
    
    // 点击输入框测试按钮
    const inputButton = page.locator('button').filter({ hasText: '输入框测试' }).first();
    await inputButton.click();
    
    // 等待Action弹窗出现
    await page.waitForTimeout(1000);
    
    // 检查是否有Action弹窗
    const actionModal = page.locator('.action-modal, .modal, [role="dialog"]');
    const isModalVisible = await actionModal.isVisible().catch(() => false);
    
    if (!isModalVisible) {
      console.log('❌ 输入框Action弹窗未出现');
      // 检查控制台错误
      const logs = await page.evaluate(() => {
        return window.console.logs || [];
      });
      console.log('控制台日志:', logs);
      throw new Error('输入框Action弹窗未出现');
    } else {
      console.log('✅ 输入框Action弹窗正常显示');
      
      // 如果弹窗存在，测试交互
      const input = page.locator('input[type="text"], input:not([type])').first();
      if (await input.isVisible()) {
        await input.fill('测试输入');
        console.log('✅ 输入框交互正常');
      }
      
      // 关闭弹窗
      const closeBtn = page.locator('button').filter({ hasText: /取消|关闭|Cancel/ }).first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });

  test('基础Action功能测试 - 多输入框', async ({ page }) => {
    console.log('开始测试多输入框Action...');
    
    const multiInputButton = page.locator('button').filter({ hasText: '多输入框测试' }).first();
    await multiInputButton.click();
    await page.waitForTimeout(1000);
    
    const actionModal = page.locator('.action-modal, .modal, [role="dialog"]');
    const isModalVisible = await actionModal.isVisible().catch(() => false);
    
    if (!isModalVisible) {
      console.log('❌ 多输入框Action弹窗未出现');
      throw new Error('多输入框Action弹窗未出现');
    } else {
      console.log('✅ 多输入框Action弹窗正常显示');
      
      // 关闭弹窗
      const closeBtn = page.locator('button').filter({ hasText: /取消|关闭|Cancel/ }).first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });

  test('基础Action功能测试 - 菜单选择', async ({ page }) => {
    console.log('开始测试菜单选择Action...');
    
    const menuButton = page.locator('button').filter({ hasText: '菜单测试' }).first();
    await menuButton.click();
    await page.waitForTimeout(1000);
    
    const actionModal = page.locator('.action-modal, .modal, [role="dialog"]');
    const isModalVisible = await actionModal.isVisible().catch(() => false);
    
    if (!isModalVisible) {
      console.log('❌ 菜单Action弹窗未出现');
      throw new Error('菜单Action弹窗未出现');
    } else {
      console.log('✅ 菜单Action弹窗正常显示');
      
      // 关闭弹窗
      const closeBtn = page.locator('button').filter({ hasText: /取消|关闭|Cancel/ }).first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });

  test('便捷方法测试 - Alert', async ({ page }) => {
    console.log('开始测试Alert便捷方法...');
    
    const alertButton = page.locator('button').filter({ hasText: 'Alert' }).first();
    await alertButton.click();
    await page.waitForTimeout(1000);
    
    const actionModal = page.locator('.action-modal, .modal, [role="dialog"]');
    const isModalVisible = await actionModal.isVisible().catch(() => false);
    
    if (!isModalVisible) {
      console.log('❌ Alert弹窗未出现');
      throw new Error('Alert弹窗未出现');
    } else {
      console.log('✅ Alert弹窗正常显示');
      
      // 关闭弹窗
      const okBtn = page.locator('button').filter({ hasText: /确定|OK/ }).first();
      if (await okBtn.isVisible()) {
        await okBtn.click();
      }
    }
  });

  test('便捷方法测试 - Confirm', async ({ page }) => {
    console.log('开始测试Confirm便捷方法...');
    
    const confirmButton = page.locator('button').filter({ hasText: 'Confirm' }).first();
    await confirmButton.click();
    await page.waitForTimeout(1000);
    
    const actionModal = page.locator('.action-modal, .modal, [role="dialog"]');
    const isModalVisible = await actionModal.isVisible().catch(() => false);
    
    if (!isModalVisible) {
      console.log('❌ Confirm弹窗未出现');
      throw new Error('Confirm弹窗未出现');
    } else {
      console.log('✅ Confirm弹窗正常显示');
      
      // 关闭弹窗
      const cancelBtn = page.locator('button').filter({ hasText: /取消|Cancel/ }).first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
      }
    }
  });

  test('控制台错误检测', async ({ page }) => {
    console.log('开始检测控制台错误...');
    
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // 测试几个主要按钮
    const buttons = [
      '输入框测试',
      'Alert', 
      'Confirm'
    ];
    
    for (const buttonText of buttons) {
      const button = page.locator('button').filter({ hasText: buttonText }).first();
      if (await button.isVisible()) {
        await button.click();
        await page.waitForTimeout(500);
        
        // 尝试关闭弹窗
        const closeBtn = page.locator('button').filter({ hasText: /取消|关闭|确定|Cancel|OK/ }).first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
        }
        await page.waitForTimeout(500);
      }
    }
    
    if (errors.length > 0) {
      console.log('❌ 发现控制台错误:', errors);
      console.log('需要修复的错误数量:', errors.length);
    } else {
      console.log('✅ 未发现控制台错误');
    }
  });

  test('Action状态管理测试', async ({ page }) => {
    console.log('开始测试Action状态管理...');
    
    // 检查ActionStateManager是否正确初始化
    const stateManagerExists = await page.evaluate(() => {
      return window.ActionStateManager !== undefined;
    });
    
    if (!stateManagerExists) {
      console.log('❌ ActionStateManager未正确初始化');
    } else {
      console.log('✅ ActionStateManager正确初始化');
    }
    
    // 检查Actions对象是否存在
    const actionsExists = await page.evaluate(() => {
      return window.Actions !== undefined;
    });
    
    if (!actionsExists) {
      console.log('❌ Actions对象未正确导出');
    } else {
      console.log('✅ Actions对象正确导出');
    }
  });
});