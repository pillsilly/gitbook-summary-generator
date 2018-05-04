var assert = require('chai').assert
const GitBookSummaryGenerator = require('../src/GitBookSummaryGenerator');
const fs = require('fs')
const RES_PATH = 'test/resource';
describe('Array', function () {
  describe('#indexOf()', function () {
    it('should return -1 when the value is not present', function () {
      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
});

describe('#Main', function () {
  afterEach(() => {
    // clear();
  });
  const summary = '/SUMMARY.md'
  const ANIMALS = 'Animals';
  it('should generate proper file', function () {
    const book = `${RES_PATH}/${ANIMALS}`;
    return GitBookSummaryGenerator.execute({
      book,
      summary
    }).then((summaryPath) => {
      assert.isTrue(fs.existsSync(summaryPath));
      const content = getContent(summaryPath);
      assert.strictEqual(content, loadAnswer(ANIMALS))
      fs.unlinkSync(summaryPath);
    })
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
