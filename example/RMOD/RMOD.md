# RMOD

[TOC]


## distName

"ABC"

## Module display

| Field                    | Data  source                                     | Sample            |
|--------------------------|--------------------------------------------------|-------------------|
| PN                       | :productName                                     | FRGT              |
| PC                       | :productCode                                     | 472810A.102       |
| SN                       | :serialNumber                                    | F7152108548       |
| ML                       | :moduleLocation                                  | WG                |
| OPT_IF/ANT/RET port name | [/CONNECTOR_L-?:connectorLabel](#connector_desc) | ANT1              |
| EAC                      | [/EAC_R](#eac_desc)                              | EAC               |
| FAN group                | [/FAN_L](#fan_group_logic)                       |                   |
| Title                    |                                                  | FRGT              |
| 2nd title                |                                                  | RMOD-1 / RMOD_R-1 |

**<a name='fan_group_logic'>Fan group description</a>**:

- Which MO is mapped:

```javascript
if current module class name is SMOD
    find children with class name FAN
else
    find children with class name FAN_L
```

- How is fan number decided?

    >By the MO number

**<a name='eac_desc'>EAC description</a>**:

- Which MO is mapped:
 First child EAC_R of RMOD(they're not in order as imTree shows).
 see eacInfoFactory.js: `const eacNodes = node.findChildrenByClassName(runtimeViewClasses.EAC);`
- Where does "EAC" comes from
 "name" is hard coded as "EAC" (for now)
- EAC might be still under developing

**<a name='connector_desc'>Connector description</a>**:

- Connector implementation main:

`runtimeModuleInfoProperties.js`

### FanGroup Diode:

#### How is data passed through components

##### Components structure

```text
--> ModuleContainerComponent.jsx
--> FanGroupComponent.jsx
--> HeaderComponent
--> StatusDiodeComponent
```

```javascript
function createRmodsBuilder(extraData) {
    return newSiteModelBuilder(hardwareDefinitions.forModules(siteModulesInfo.rmod()), extraData)
        ...
        .withAttribute('createFanGroup', 'fanGroup', fanGroupBuilder)// create property fanGroup by calling 'createFanGroup' in rmodInfoFactory
       ...
}
```

```javascript
builders.forEach((value, key) => {builtModules[key] = value(extraData)
    .fromTree(decoratedImTree)
    .build(extraData); // this is when createRmodsBuilder is called
```

For every `withAttribute` and for instance `createFanGroup`:
it is called in hardwareDefinitionsFactory:resolveProperty

```javascript
function resolveProperty(attribute) {
    const propertyResolver = moduleInfo.properties[attribute.propertyName];
    if (!propertyResolver) {
        LOG.error(`No property ${attribute.propertyName} for given module info`);

        return null;
    }
    return propertyResolver(object, createBuilder, attribute.extraData, extraData);
}
```

For propertyResolver(`object`, createBuilder, attribute.extraData, extraData),
`object` is the out put of rmodInfoFactory.js:wrapToObjectNode

![What is the extraData like in createRmodsBuilder(extraData)](2018-03-27-18-06-19.png)

#### How is a fan diode decided

```javascript
function mergeOperationalState(stateInfos) {
    //check #fan_group_logic to know how is stateInfos decided
    if (_.all(stateInfos, {operationalState: 'Enabled'}))
        return 'Enabled';
    if (_.some(stateInfos, {operationalState: 'Disabled'}))
        return 'Disabled';
    return null;
}
```

### Connector's diode

![Simply against the `stateInfo` under connector class.](2018-03-28-10-43-51.png)

### EAC's diode

the same to Connector's, stateInfo under EAC noden

## Q&A

### If connector information is related to bpf

>NO

### Why is EAC detail empty?

Only name and class name was extracted in `eacInfoFactory.js`


### Why is below RET has no diode to displayed?

No such requirement even the MO structure seem to be supportive.

![](2018-03-28-14-59-33.png)

```javascript
//if getStateInfo is not defined, diode won't be shown because no stateInfo will be generated, as you can see RSL has no getStateInfo defined, so RET connector will not have a diode to display
const connectorModelMapper = {};
connectorModelMapper[runtimeViewClassesService.SFP] = {
    getConnector: getSfpConnector,
    getLabel,
    getStateInfo
};
connectorModelMapper[runtimeViewClassesService.RSL] = {
    getConnector,
    getLabel: getRslLabel
};
connectorModelMapper[runtimeViewClassesService.ANTL] = {
    getConnector,
    getLabel: getAntlLabel,
    getStateInfo
};
connectorModelMapper[runtimeViewClassesService.PHYANT] = {
    getConnector,
    getLabel: getPhyantLabel
};
```

How to trace the state info for rmod connectors?

- Debug in this function(runtimeNodeConnectorInfoFactory.js):

```javascript
stateInfo(moduleInfoModel) {
    return moduleInfoModel.getStateInfo && moduleInfoModel.getStateInfo();
}
```

### Why does OPT_IF sometimes has no diode?

>From spec pov, it is because it is not installed.
When an OPT_IF is connected to RMOD, SFP will generated by system it self.(user doesn't need to configure it).

![](2018-03-29-17-19-55.png)

### TODO

- [ ] 1. Alarm
