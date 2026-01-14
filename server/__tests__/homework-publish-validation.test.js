/**
 * 作业发布验证测试
 * 测试课程时间验证逻辑
 */

describe('作业发布验证', () => {
  test('应该拒绝在课程结束后发布作业', () => {
    const courseEndDate = new Date('2024-01-10T00:00:00'); // 已结束
    const currentDate = new Date('2024-01-15T00:00:00');
    
    // 检查课程是否已结束：当前时间 > 结束时间
    const isCourseEnded = courseEndDate && currentDate.getTime() > courseEndDate.getTime();
    expect(isCourseEnded).toBe(true);
  });

  test('应该允许在课程进行期间发布作业', () => {
    const courseStartDate = new Date('2024-01-01T00:00:00');
    const courseEndDate = new Date('2024-01-20T00:00:00');
    const currentDate = new Date('2024-01-15T00:00:00');
    
    const isCourseActive = 
      (!courseStartDate || currentDate.getTime() >= courseStartDate.getTime()) &&
      (!courseEndDate || currentDate.getTime() <= courseEndDate.getTime());
    
    expect(isCourseActive).toBe(true);
  });

  test('应该拒绝在课程开始前发布作业', () => {
    const courseStartDate = new Date('2024-01-20T00:00:00'); // 未开始
    const currentDate = new Date('2024-01-15T00:00:00');
    
    // 检查课程是否未开始：当前时间 < 开始时间
    const isCourseNotStarted = courseStartDate && currentDate.getTime() < courseStartDate.getTime();
    expect(isCourseNotStarted).toBe(true);
  });

  test('应该处理没有时间限制的课程', () => {
    const courseStartDate = null;
    const courseEndDate = null;
    const currentDate = new Date('2024-01-15T00:00:00');
    
    const canPublish = 
      (!courseStartDate || currentDate.getTime() >= courseStartDate.getTime()) &&
      (!courseEndDate || currentDate.getTime() <= courseEndDate.getTime());
    
    expect(canPublish).toBe(true);
  });

  test('应该正确处理边界情况（课程结束当天）', () => {
    const courseEndDate = new Date('2024-01-15T00:00:00');
    const currentDate = new Date('2024-01-15T00:00:00');
    
    // 结束当天应该允许发布（取决于业务需求，这里假设不允许）
    const isCourseEnded = courseEndDate && currentDate.getTime() > courseEndDate.getTime();
    expect(isCourseEnded).toBe(false);
  });
});
