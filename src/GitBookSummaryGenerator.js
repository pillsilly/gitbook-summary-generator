var dir = require('node-dir');
var TreeModel = require('tree-model');
var treeModel = new TreeModel();
var _ = require('lodash');
var fs = require('fs')
var lineReader = require('line-reader');
const program = require('commander');
program
    .version('0.1.0')
    .option('-b, --book [book]', '', process.cwd())
    .option('-s, --summary [summary]', '', process.cwd() + '/SUMMARY.md')
    .parse(process.argv);

let bookDir = program.book;
let summaryFilePath = program.summary;

const basePath = process.cwd();

if (bookDir.indexOf(basePath) === -1) {
    bookDir = `${basePath}/${bookDir}`;
}

if (summaryFilePath.indexOf(basePath) === -1) {
    summaryFilePath = `${basePath}/${summaryFilePath}`;
}

bookDir = bookDir.replace(/\//g, '\\');
summaryFilePath = summaryFilePath.replace(/\//g, '\\');

console.log(bookDir)
console.log(summaryFilePath)

function getCandidateFiles(paths) {
    return paths.files
        .map(file => ({ isDir: false, path: file }))
        .concat(paths.dirs.map(dir => ({ isDir: true, path: dir })))
        .filter(item => ['_book', 'SUMMARY.md', 'README.md'].every(test => item.path.indexOf(test) === -1));
}


dir.paths(bookDir, function (err, paths) {
    if (err) throw err;
    const candidateFiles = getCandidateFiles(paths);
    const fileTree = transForm2Tree(candidateFiles);
    Promise.all(fileTree.all().map(revampNode))
        .then(d => {
            const summaryText = _.reduce(fileTree.all(), (result, current) => {
                if (current.isRoot())
                    return result;

                return result.concat(toSummarryText(current.model.data));
            }, []).map(line => line.replace(bookDir, ''));
            summaryText.forEach(f => {
                console.log(f)
            })
            fs.writeFileSync(summaryFilePath, summaryText.join('\r'), 'utf-8');
            console.log(`Created ${summaryFilePath}`)
        });
});

function transForm2Tree(candidateFiles) {
    let oTree = treeModel.parse({ name: 'root', children: [], data: { path: bookDir, isDir: true, level: 0 } });
    while (candidateFiles.length) {
        oTree = _.reduce(candidateFiles,
            putBack(candidateFiles),
            oTree)
    }
    return oTree;
}

function putBack(candidateFiles) {
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

function toSummarryText(item) {
    const fileExpression = getFileExpression(item);
    if (item.levelTextArray && item.levelTextArray.length) {
        return fileExpression.concat(item.levelTextArray.map((lt) => {
            const ltTitle = titleToTitle(lt.title);
            const summaryLine = `${toTab(item.fileLevel, lt.level + 1)}* [${ltTitle}](${convertTitleToLink(item, lt)})`;
            return summaryLine;
        }))
    }
    return fileExpression;
}

function getFileExpression(item) {
    if (!item.path.endsWith('.md'))
        item.path = item.path + '.md';

    const summaryLine = `${toTab(item.fileLevel)}* [${pathToTitle(item.path)}](${item.path})`;
    return [summaryLine];
}

function convertTitleToLink(item, lt) {
    const link = `${item.path}#${lt.title.toLowerCase().replace(/#?/g, '').trim().replace(/\s/g, '-').replace(/[^a-z|^0-9^-]/ig, '')}`;
    return link;
}

function toTab(fileLevel, level = 0) {
    return _.repeat('\t', (fileLevel + level) - 1);
}

function pathToTitle(path) {
    return _.last(path.split('\\')).replace(/.md/, '').trim();
}

/** 
 * @param title title here 
 * */
function titleToTitle(title) {
    return title.replace(/#/g, '').trim();
}

function getFileLevel(ROOT_DIR, current) {
    const relateivePath = current.path.replace(ROOT_DIR, '');
    const level = relateivePath ? relateivePath.match(/\\/g).length : 0;
    console.log(`>>> ${current.path} has dir level:${level}`);
    return level;
}

const TITLE_REGEX = /^#*\s/;
function revampNode(node) {
    if (node.isRoot()) return Promise.resolve();
    return new Promise((resolve, reject) => {
        if (node.model.data.isDir || !node.model.data.path.endsWith('.md') || node.model.data.path.endsWith('README.md'))
            resolve();

        const fileLevel = getFileLevel(bookDir, node.model.data);
        node.model.data.fileLevel = fileLevel;
        let levelCount = {};
        let lastLevel = 0;
        lineReader.eachLine(node.model.data.path, function (line, last) {
            const matched = _.get(line.match(TITLE_REGEX), [0], '').trim();
            if (matched) {
                const level = matched.length - 1;
                if (level < lastLevel)
                    levelCount[lastLevel] = 0;

                if (levelCount[level])
                    levelCount[level].count = levelCount[level].count + 1;
                else
                    levelCount[level] = { count: 0 };

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
    }).then(() => console.log(`${node.model.data.path} is resolved`));;
}

function splitFileAndDir(file) {
    return {
        filename: file.split('\\').reverse()[0],
        dir: file.substring(0, file.length - name.length - 1)
    };
}

function isParentDir(parentPath, testPath) {
    const t = testPath.split('\\');
    t.pop();
    const currentPath = t.join('\\');
    return currentPath === parentPath
}
