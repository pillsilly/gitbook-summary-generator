const dir = require('node-dir');
const treeModel = function () {
    const TreeModel = require('tree-model');
    return new TreeModel();
}();
const _ = require('lodash');
const lineReader = require('line-reader');
const program = require('commander');
const fs = require('fs')
const EXCLUDED_FILES = Object.freeze(['_book', 'SUMMARY.md', 'README.md']);
program
    .version('0.1.0')
    .option('-b, --book [book]', '', process.cwd())
    .option('-s, --summary [summary]', '', process.cwd() + '/SUMMARY.md')
    .parse(process.argv);

const BASE_PATH = process.cwd();
let bookDir = program.book;
let summaryFilePath = program.summary;
if (bookDir.indexOf(BASE_PATH) === -1) {
    bookDir = `${BASE_PATH}/${bookDir}`;
}
if (summaryFilePath.indexOf(BASE_PATH) === -1) {
    summaryFilePath = `${BASE_PATH}/${summaryFilePath}`;
}
bookDir = bookDir.replace(/\//g, '\\');
summaryFilePath = summaryFilePath.replace(/\//g, '\\');

dir.paths(bookDir, function (err, paths) {
    if (err) throw err;
    const candidateFiles = getCandidateFiles(paths);
    const fileTree = transForm2Tree(candidateFiles);
    Promise.all(fileTree.all().map(revampNode))
        .then(() => {
            const summaryLines = _.reduce(fileTree.all(), (result, current) => {
                if (current.isRoot())
                    return result;

                return result.concat(toSummarryLine(current.model.data));
            }, []);
            console.log(summaryLines.join('\r'))
            fs.writeFileSync(summaryFilePath, summaryLines.join('\r'), 'utf-8');
        });
});

function getCandidateFiles(paths) {
    return paths.files
        .map(file => ({ isDir: false, path: file }))
        .concat(paths.dirs.map(dir => ({ isDir: true, path: dir })))
        .filter(item => EXCLUDED_FILES.every(isNotExcludeFile(item)));

    function isNotExcludeFile(item) {
        return excludeFilePath => item.path.indexOf(excludeFilePath) === -1;
    }
}

function toRelativePath(line) {
    return line.replace(bookDir, '');
}

function transForm2Tree(candidateFiles) {
    let oTree = treeModel.parse({ name: 'root', children: [], data: { path: bookDir, isDir: true, level: 0 } });
    while (candidateFiles.length) {
        oTree = _.reduce(candidateFiles,
            pick2Tree(candidateFiles),
            oTree)
    }
    return oTree;
}

function pick2Tree(candidateFiles) {
    return (tree, current) => {
        if (!current)
            return tree;

        tree.walk(node => {
            if (node.model.data.isDir && isParentDir(node.model.data.path, current.path)) {
                node.addChild(treeModel.parse({ name: current.path, data: { path: current.path, isDir: current.isDir } }))
                _.pull(candidateFiles, current);
            }
        });
        return tree;
    }
}

function toSummarryLine(item) {
    const fileExpression = getFileExpression(item);
    if (item.levelTextArray && item.levelTextArray.length) {
        return fileExpression.concat(item.levelTextArray.map((lt) => `${getTab(item.fileLevel, lt.level + 1)}* [${removeSharp(lt.title)}](${getLink(item, lt)})`))
    }
    return fileExpression;
}

function getFileExpression(item) {
    if (!item.path.endsWith('.md'))
        item.path = item.path + '.md';

    const summaryLine = `${getTab(item.fileLevel)}* [${getTitle(item.path)}](${item.path})`;
    return [summaryLine];
}

function getLink(item, lt) {
    return toRelativePath(`${item.path}#${lt.title.toLowerCase().replace(/#?/g, '').trim().replace(/\s/g, '-').replace(/[^a-z|^0-9^-]/ig, '')}`);
}

function getTab(fileLevel, level = 0) {
    return _.repeat('\t', fileLevel + level - 1);
}

function getTitle(path) {
    return _.last(path.split('\\')).replace(/.md/, '').trim();
}

function removeSharp(markDownTitle) {
    return markDownTitle.replace(/#/g, '').trim();
}

function getFileLevel(ROOT_DIR, current) {
    const relateivePath = current.path.replace(ROOT_DIR, '');
    return relateivePath ? relateivePath.match(/\\/g).length : 0;
}

const MD_TITLE_REGEX = /^#*\s/;
function revampNode(node) {
    if (node.isRoot()) return Promise.resolve();
    return new Promise((resolve, reject) => {
        if (node.model.data.isDir || !node.model.data.path.endsWith('.md') || node.model.data.path.endsWith('README.md'))
            resolve();

        node.model.data.fileLevel = getFileLevel(bookDir, node.model.data);
        const levelCounterMap = {};
        let lastLevel = 0;
        lineReader.eachLine(node.model.data.path, function (line, last) {
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

                if (node.model.data.levelTextArray)
                    node.model.data.levelTextArray.push(levelText);
                else
                    node.model.data.levelTextArray = [levelText];

                lastLevel = level;
            }
            if (last)
                resolve()
        })
    });
}

function isParentDir(parentPath, testPath) {
    const t = testPath.split('\\');
    t.pop();
    const currentPath = t.join('\\');
    return currentPath === parentPath
}
