const dir = require('node-dir');
const _ = require('lodash');
const lineReader = require('line-reader');
const fs = require('fs')
const EXCLUDED_FILES = Object.freeze(['_book', 'SUMMARY.md', 'README.md']);
const COMMON_SEP = '/';
const WIN_SEP_REGEX = /\\/g;

GitBookSummaryGenerator = function ({ book, summary, title }) {
    const BASE_PATH = unifySep(process.cwd());
    let bookDir = unifySep(book);
    let summaryFilePath = unifySep(summary);
    if (bookDir.indexOf(BASE_PATH) === -1) {
        bookDir = `${BASE_PATH}/${bookDir}`;
    }
    if (summaryFilePath.indexOf(BASE_PATH) === -1) {
        summaryFilePath = `${BASE_PATH}/${summaryFilePath}`;
    }

    dir.paths(bookDir, function (err, paths) {
        if (err) throw err;
        const candidateFiles = [{ isDir: true, path: bookDir }].concat(getCandidateFiles(paths));
        Promise.all(candidateFiles.map(revampNode))
            .then(() => {
                console.log(JSON.stringify(candidateFiles));
                const summaryLines = _.reduce(candidateFiles, (result, node) => {
                    if (isRoot(node))
                        return result;

                    return result.concat(toSummarryLine(node));
                }, []);
                console.log(summaryLines.join('\r'))
                fs.writeFileSync(summaryFilePath, generateTitle() + summaryLines.join('\r'), 'utf-8');
            });
    });


    function generateTitle() {
        return `# ${title}\r\r`;
    }

    function isRoot(node) {
        return node.path === bookDir;
    }

    function insert(n, ins, arr) {
        return [...arr.slice(0, n), ins, ...arr.slice(n)];
    }

    function getCandidateFiles(paths) {
        let files = paths.files
            .map(file => ({ isDir: false, path: unifySep(file) }))

        const dirs = paths.dirs.map(dir => ({ isDir: true, path: unifySep(dir) }));
        dirs.forEach(dir => {
            for (let i = 0; i < files.length; i++) {
                if (!isParentFolder(files[i], dir))
                    continue;
                files = insert(i, dir, files);
                break;
            }

            function isParentFolder(a, b) {
                return ((b.isDir && !a.isDir && a.path.indexOf(b.path) > -1))
            }

        });
        return files.filter(item => EXCLUDED_FILES.every(isNotExcludeFile(item))).sort((a, b) => {
            return (b.isDir && !a.isDir && a.path.indexOf(b.path) > -1) ? 1 : -1;
        })
        function isNotExcludeFile(item) {
            return excludeFilePath => item.path.indexOf(excludeFilePath) === -1;
        }
    }

    function toRelativePath(line) {
        return line.replace(bookDir, '');
    }

    function toSummarryLine(item) {
        const fileExpression = getFileExpression(item);
        if (item.levelTextArray && item.levelTextArray.length) {
            return fileExpression.concat(item.levelTextArray.map((lt) => `${getTab(item.fileLevel, lt.level)}* [${removeSharp(lt.title)}](${getLink(item, lt)})`))
        }
        return fileExpression;
    }

    function getFileExpression(item) {
        if (item.isDir)
            return [`${getTab(item.fileLevel)}- ${getTitle(item.path)}`];

        if (!item.isDir && item.path.endsWith('.md'))
            return [`${getTab(item.fileLevel)}* [${getTitle(item.path)}](${toRelativePath(item.path)})`];

        console.warn(`Unexpected item ${JSON.stringify(item)}`);
        return [''];
    }

    function getLink(item, lt) {
        return toRelativePath(`${item.path}#${lt.title.toLowerCase().replace(/#?/g, '').trim().replace(/\s/g, '-').replace(/[^a-z|^0-9^-]/ig, '')}`);
    }

    function getTab(fileLevel, level = 0) {
        return _.repeat('\t', fileLevel + level - 1);
    }

    function getTitle(path) {
        return _.last(path.split(COMMON_SEP)).replace(/.md/, '').trim();
    }

    function removeSharp(markDownTitle) {
        return markDownTitle.replace(/#/g, '').trim();
    }

    function getFileLevel(ROOT_DIR, current) {
        const relateivePath = current.path.replace(ROOT_DIR, '');
        return relateivePath ? relateivePath.match(new RegExp(COMMON_SEP, 'g')).length : 0;

    }

    const MD_TITLE_REGEX = /^#*\s/;
    function revampNode(node) {
        if (isRoot(node))
            return Promise.resolve();

        return new Promise((resolve, reject) => {
            if (node.isDir || !node.path.endsWith('.md') || node.path.endsWith('README.md'))
                resolve();

            node.fileLevel = getFileLevel(bookDir, node);
            const levelCounterMap = {};
            let lastLevel = 0;
            lineReader.eachLine(node.path, function (line, last) {
                const mdTitle = _.get(line.match(MD_TITLE_REGEX), [0], '').trim();
                if (mdTitle) {
                    const level = mdTitle.length - 1;
                    if (level < lastLevel)
                        levelCounterMap[lastLevel] = 0;

                    if (levelCounterMap[level])
                        levelCounterMap[level].count = levelCounterMap[level].count + 1;
                    else
                        levelCounterMap[level] = { count: 0 };

                    const levelText = { level: level, title: line };

                    if (node.levelTextArray)
                        node.levelTextArray.push(levelText);
                    else
                        node.levelTextArray = [levelText];

                    lastLevel = level;
                }
                if (last)
                    resolve()
            })
        });
    }

    function unifySep(path) {
        return path && path.replace(WIN_SEP_REGEX, COMMON_SEP);
    }

    function isParentDir(parentPath, testPath) {
        const t = testPath.split(COMMON_SEP);
        t.pop();
        const currentPath = t.join(COMMON_SEP);
        return currentPath === parentPath
    }
}

module.exports.newInstance = GitBookSummaryGenerator;