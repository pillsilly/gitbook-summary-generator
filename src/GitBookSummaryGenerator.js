const dir = require('node-dir');
const _ = require('lodash');
const lineReader = require('line-reader');
const fs = require('fs')
const EXCLUDED_FILES = ['_book', 'SUMMARY.md', 'README.md', '.git', '.vscode'];
const COMMON_SEP = '/';
const WIN_SEP_REGEX = /\\/g;
const MD_TITLE_REGEX = /^#*\s/;
const DEFAULT_TITLE = 'This is your book title';
/**
 * @param  {} {book
 * @param  {} summary
 * @param  {} title='Thisisyourbooktitle'}
 */
module.exports.execute = function ({ book, summary, title = DEFAULT_TITLE, exclude = [] }) {
    exclude = exclude.concat(EXCLUDED_FILES);
    const BASE_PATH = unifySep(process.cwd());
    let bookDir = unifySep(book);
    let summaryFilePath = unifySep(`${book}/${summary}`);
    if (bookDir.indexOf(BASE_PATH) === -1) {
        bookDir = `${BASE_PATH}/${bookDir}`;
    }
    if (summaryFilePath.indexOf(BASE_PATH) === -1) {
        summaryFilePath = `${BASE_PATH}/${summaryFilePath}`;
    }

    summaryFilePath = unionBackSlash(summaryFilePath);

    const paths = dir.files(bookDir, 'all', _.noop, { sync: true });
    const candidateFiles = [{ isDir: true, path: bookDir }].concat(getCandidateFiles(paths));
    return Promise.all(candidateFiles.map(revampNode))
        .then(() => {
            const summaryLines = _.reduce(candidateFiles, (result, node) => {
                if (isRoot(node) || node.isEmpty)
                    return result;

                return result.concat(toSummarryLine(node));
            }, []).filter(line => !!line);
            console.log(summaryLines.join('\r'))
            fs.writeFileSync(summaryFilePath, generateTitle() + summaryLines.join('\r'), 'utf-8');
            return summaryFilePath;
        })

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

        return files
            .filter(item => (item.path.endsWith('.md') || item.isDir) && exclude.every(isNotExcludeFile(item)))
            .sort((a, b) => (b.isDir && !a.isDir && a.path.indexOf(b.path) > -1) ? 1 : -1)

        function isNotExcludeFile(item) {
            return excludeFilePath => item.path.indexOf(excludeFilePath) === -1;
        }
    }

    function toRelativePath(line) {
        return line.replace(bookDir, '');
    }

    function toSummarryLine(fileItem) {
        let fileExpression = getFileMenu(fileItem);
        fileExpression = addTitleMenu(fileItem, fileExpression);
        return fileExpression;
    }

    function addTitleMenu(fileItem, fileExpression) {
        if (fileItem.levelTextArray && fileItem.levelTextArray.length) {
            fileExpression = fileExpression.concat(fileItem.levelTextArray.map((lt) => `${getTab(fileItem.fileLevel + 1, lt.level)}* [${removeSharp(lt.title)}](${getLink(fileItem, lt)})`))
        }
        return fileExpression;
    }

    function getFileMenu(item) {
        if (item.isDir)
            return [`${getTab(item.fileLevel)}- ${getTitle(item.path)}`];

        if (isMdFile(item))
            return [`${getTab(item.fileLevel)}* [${getTitle(item.path)}](${toRelativePath(item.path)})`];

        console.warn(`Unexpected item ${JSON.stringify(item)}`);
        return [''];

        function isMdFile(item) {
            return !item.isDir && item.path.endsWith('.md');
        }
    }

    function getFirstChildMD(item) {
        return '';
    }

    function getLink(item, lt) {
        return toRelativePath(`${item.path}#${lt.title.toLowerCase().replace(/#?/g, '').trim().replace(/\s/g, '-').replace(/[^a-z|^0-9^-]/ig, '')}`);
    }

    function getTab(fileLevel, level = 0) {
        return _.repeat('   ', fileLevel + level - 1);
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

    function revampNode(node) {
        if (isRoot(node))
            return Promise.resolve();

        return new Promise((resolve, reject) => {
            if (node.isDir || !node.path.endsWith('.md') || node.path.endsWith('README.md')) {
                resolve();
                return
            }

            if (node.isDir && hasNoAvailabelMD(node)) {
                node.isEmpty = true;
                return;
            }


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
            }, function (a, b, c) {
                if (!node.isDir && !node.levelTextArray)
                    node.isEmpty = true;

                resolve();
            })
        });
    }
}

function unionBackSlash(path) {
    if (path.indexOf('//') === -1)
        return path;

    path = path.replace('//', '/');
    return unionBackSlash(path);
}

function isParentDir(parentPath, testPath) {
    const t = testPath.split(COMMON_SEP);
    t.pop();
    const currentPath = t.join(COMMON_SEP);
    return currentPath === parentPath
}
function unifySep(path) {
    return path && path.replace(WIN_SEP_REGEX, COMMON_SEP);
}

module.exports.unifySep = unifySep;
module.exports.CONST = {
    DEFAULT_TITLE
};