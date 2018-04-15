# Generic Implementations

[TOC]

## Detail panel

### How is data passed to detail panel when visualized module is clicked

first the tab will be initialized in
site-runtime-views.directive.js:116

```javascript
function createHardwareViewDetailsContext() {
  detailsContext.newContext({imTreeChangeSubscriber: $scope.imTreeChangeSubscriber}, 'hardware-details');
}
```

then when call `onClick:admin-ui/src/components/new-site/site.directive.js:277`

- it will call `siteSelectionsService.setSelected:admin-ui/src/components/new-site/site-selection-service.js:34`

- it will call `watcher.notify:admin-ui/src/components/new-site/site-selection-service.js:64`

- it will call `showDetails:admin-ui/src/components/new-site/site.directive.js:277`

- it will update hardware-details(directive) created from the start.

## Diode

### StatusDiodeComponent

#### RMOD

```javascript
<!-- tooltip I18N -->
diode: {
    tooltip: {
        OPERATIONAL: 'Operational',
        FAILED: 'Failed',
        DEGRADED: 'Degraded',
        OFFLINE: 'Offline',
        NOT_INSTALLED: 'Not installed',
        DEPENDENCY: 'Dependency',
        AVAILABLE: 'Available',
        NOT_AVAILABLE: 'Not available'
    }
}
<!-- DIODE_TYPES definitions -->
const DIODE_TYPES = {
    OPERATIONAL: {
        colorClass: 'green-diode',
        tooltipKey: 'OPERATIONAL'
    },
    FAILED: {
        colorClass: 'red-diode',
        tooltipKey: 'FAILED'
    },
    DEGRADED: {
        colorClass: 'yellow-diode',
        tooltipKey: 'DEGRADED'
    },
    OFFLINE: {
        colorClass: 'gray-diode',
        tooltipKey: 'OFFLINE'
    },
    NOT_INSTALLED: {
        colorClass: 'gray-diode',
        tooltipKey: 'NOT_INSTALLED'
    },
    DEPENDENCY: {
        colorClass: 'empty-diode',
        tooltipKey: 'DEPENDENCY'
    },
    AVAILABLE: {
        colorClass: 'green-diode',
        tooltipKey: 'AVAILABLE'
    },
    NOT_AVAILABLE: {
        colorClass: 'red-diode',
        tooltipKey: 'NOT_AVAILABLE'
    },
    UNKNOWN: {
        colorClass: 'unknown-diode'
    }
};
<!-- Status mapping definitions -->
const statesMapping = {
    Enabled: {
        Online: DIODE_TYPES.OPERATIONAL,
        Degraded: DIODE_TYPES.DEGRADED
    },
    Disabled: {
        Failed: DIODE_TYPES.FAILED,
        Dependency: DIODE_TYPES.DEPENDENCY,
        Offline: DIODE_TYPES.OFFLINE,
        NotInstalled: DIODE_TYPES.NOT_INSTALLED,
        PowerOff: DIODE_TYPES.OFFLINE
    }
};

const operational = stateInfo.operationalState;
const availability = stateInfo.availabilityStatus;
cssClass = statesMapping[operational][availability];
```

##### Samples

**RMOD**

![](2018-03-26-15-04-00.png)
![](2018-03-26-15-24-54.png)

**GNCELL_R**

![](2018-03-26-15-04-45.png)
![](2018-03-26-15-25-39.png)

**Other components that using the same component(StatusDiodeComponent)**
![](2018-03-26-16-12-43.png)

#### Parent components

1. ConnectorComponent
2. HeaderComponent