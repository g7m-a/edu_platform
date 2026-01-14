/**
 * AI JSON解析测试
 * 测试AI返回的JSON格式解析的健壮性
 */

describe('AI JSON解析', () => {
  test('应该正确解析标准JSON格式', () => {
    const validJson = '{"score": 85, "comment": "学生答案基本正确"}';
    const result = JSON.parse(validJson);
    
    expect(result.score).toBe(85);
    expect(result.comment).toBeDefined();
    expect(typeof result.score).toBe('number');
  });

  test('应该处理包含额外文本的JSON响应', () => {
    const mixedResponse = '这是AI的回复：{"score": 90, "comment": "很好"} 希望有帮助';
    
    // 使用正则提取JSON部分
    const jsonMatch = mixedResponse.match(/\{[\s\S]*\}/);
    expect(jsonMatch).not.toBeNull();
    
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      expect(result.score).toBe(90);
      expect(result.comment).toBe('很好');
    }
  });

  test('应该验证分数范围（0-100）', () => {
    const testCases = [
      { score: 0, valid: true },
      { score: 50, valid: true },
      { score: 100, valid: true },
      { score: -1, valid: false },
      { score: 101, valid: false },
      { score: 150, valid: false }
    ];

    testCases.forEach(({ score, valid }) => {
      const isValid = score >= 0 && score <= 100 && Number.isInteger(score);
      expect(isValid).toBe(valid);
    });
  });

  test('应该处理无效的JSON格式', () => {
    const invalidJson = '这不是JSON格式';
    
    expect(() => {
      JSON.parse(invalidJson);
    }).toThrow();
  });

  test('应该处理缺少必需字段的JSON', () => {
    const incompleteJson = '{"score": 85}'; // 缺少comment
    
    const result = JSON.parse(incompleteJson);
    expect(result.score).toBeDefined();
    expect(result.comment).toBeUndefined();
  });

  test('应该处理多行JSON格式', () => {
    const multilineJson = `{
      "score": 88,
      "comment": "总体评价：学生的答案基本正确"
    }`;
    
    const result = JSON.parse(multilineJson);
    expect(result.score).toBe(88);
    expect(result.comment).toBeDefined();
  });

  test('应该验证评语长度要求（200-400字）', () => {
    const shortComment = '太短'; // 2字
    const validComment = '总体评价：学生的答案基本正确，但在某些方面还有改进空间。各维度分析：准确性方面，学生基本理解了核心概念，但在细节处理上存在不足。完整性方面，答案涵盖了主要要点，但缺少一些关键细节。逻辑性方面，答案结构清晰，论证过程合理。优点：1) 核心概念理解准确；2) 答案结构清晰；3) 语言表达流畅。不足：1) 缺少具体案例支撑；2) 部分细节不够准确；3) 结论部分可以更深入。改进建议：建议学生多阅读相关文献，加深对细节的理解，并在答案中加入具体案例来支撑观点。'; // 约300字
    const longComment = 'a'.repeat(500); // 500字
    
    expect(shortComment.length < 200).toBe(true);
    expect(validComment.length >= 200 && validComment.length <= 400).toBe(true);
    expect(longComment.length > 400).toBe(true);
  });
});
