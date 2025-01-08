
export class Version extends Object {
    constructor(major, minor, build) {
        super()
        this.major = major
        this.minor = minor
        this.build = build
    }

    static fromString(version) {
        //If can't parse, return empty version
        if (typeof(version) != 'string') { 
            return new Version(0, 0, 0)
        }

        console.log(typeof(version))
    
        version = version.replace(/^v/, '');
        var arr = version.split('.');
    
        // parse int or default to 0
        var maj = parseInt(arr[0]) || 0;
        var min = parseInt(arr[1]) || 0;
        var rest = parseInt(arr[2]) || 0;

        return new Version(maj, min, rest)
    }

    toString() {
        return `v${this.major}.${this.minor}.${this.build}`
    }

    versionCompare(otherVersion) {
        const majorComp = this.major < otherVersion.major;
        if (majorComp) {
            return majorComp;
        }

        const minorComp = this.minor < otherVersion.minor;
        if (minorComp) {
            return minorCompt
        }

        const buildComp = this.build < otherVersion.build;
        if (buildComp) {
            return buildComp
        }

        return 0
    }

    equals(otherVersion) {
        return this.versionCompare(otherVersion) === 0;
    }
}