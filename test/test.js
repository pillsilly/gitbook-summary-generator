var assert = require('chai').assert
const GitBookSummaryGenerator = require('../src/GitBookSummaryGenerator');
const fs = require('fs')
const RES_PATH = 'test/resource';
const ANIMALS = 'Animals';
const books = [
  'Animals'
];

describe('Array', function () {
  describe('#indexOf()', function () {
    it('should return -1 when the value is not present', function () {
      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
});

describe('#Main', function () {
  books.forEach(bookDir => {
    it(`should generate proper file for ${bookDir}`, function () {
      const fullBookDir = `${RES_PATH}/${bookDir}`;
      return GitBookSummaryGenerator.execute({
        book: fullBookDir,
        summary: '/SUMMARY.md'
      }).then((summaryPath) => {
        assert.isTrue(fs.existsSync(summaryPath));
        const content = getContent(summaryPath);
        const expected = loadAnswer(bookDir);
        assert.strictEqual(content, expected)
        // fs.unlinkSync(summaryPath);
      })
    });
  });

  function getContent(file) {
    return fs.readFileSync(file, 'utf-8');
  }
  function getLines(file) {
    return getContent().split('\r');
  }

  function loadAnswer(answerID) {
    return fs.readFileSync(`test/resource/answers/${answerID}.SUMMARY.md`, 'utf-8');
  }
});
