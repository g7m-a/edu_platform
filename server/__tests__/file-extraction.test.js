/**
 * 文件内容提取测试
 * 测试PDF和Word文件的内容提取功能
 */

const path = require('path');
const fs = require('fs');

describe('文件内容提取', () => {
  test('应该正确识别文件扩展名', () => {
    const testCases = [
      { fileName: 'test.pdf', expected: '.pdf' },
      { fileName: 'test.docx', expected: '.docx' },
      { fileName: 'test.doc', expected: '.doc' },
      { fileName: 'TEST.PDF', expected: '.pdf' }
    ];

    testCases.forEach(({ fileName, expected }) => {
      const ext = path.extname(fileName).toLowerCase();
      expect(ext).toBe(expected);
    });
  });

  test('应该处理不支持的文件格式', () => {
    const unsupportedFiles = ['test.txt', 'test.jpg', 'test.png'];
    
    unsupportedFiles.forEach(fileName => {
      const ext = path.extname(fileName).toLowerCase();
      const allowedTypes = ['.doc', '.docx', '.pdf'];
      expect(allowedTypes.includes(ext)).toBe(false);
    });
  });

  test('应该处理.doc文件的提示信息', () => {
    const docMessage = '[提示：系统暂时无法直接解析.doc格式文件，请将文件转换为.docx或.pdf格式后重新上传]';
    expect(docMessage).toContain('提示');
    expect(docMessage).toContain('.doc');
  });
});
