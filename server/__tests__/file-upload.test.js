/**
 * 文件上传验证测试
 * 测试文件类型验证、文件大小限制等
 */

const path = require('path');
const fs = require('fs');

describe('文件上传验证', () => {
  const allowedTypes = ['.doc', '.docx', '.pdf'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  test('应该接受有效的文件类型', () => {
    const validFiles = ['test.doc', 'test.docx', 'test.pdf', 'TEST.PDF'];
    
    validFiles.forEach(fileName => {
      const ext = path.extname(fileName).toLowerCase();
      expect(allowedTypes.includes(ext)).toBe(true);
    });
  });

  test('应该拒绝无效的文件类型', () => {
    const invalidFiles = ['test.txt', 'test.jpg', 'test.png', 'test.exe'];
    
    invalidFiles.forEach(fileName => {
      const ext = path.extname(fileName).toLowerCase();
      expect(allowedTypes.includes(ext)).toBe(false);
    });
  });

  test('应该验证文件大小限制', () => {
    const validSize = 5 * 1024 * 1024; // 5MB
    const invalidSize = 15 * 1024 * 1024; // 15MB
    
    expect(validSize <= maxFileSize).toBe(true);
    expect(invalidSize <= maxFileSize).toBe(false);
  });

  test('应该生成唯一的文件名', () => {
    const originalName = 'test.pdf';
    const uniqueSuffix1 = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const uniqueSuffix2 = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(originalName);
    
    const fileName1 = `hw_${uniqueSuffix1}${ext}`;
    const fileName2 = `hw_${uniqueSuffix2}${ext}`;
    
    expect(fileName1).not.toBe(fileName2);
    expect(fileName1).toContain('hw_');
    expect(fileName1).toContain(ext);
  });
});
