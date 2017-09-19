describe "when we open Atom", ->
  it "the night-night package should activate", ->
    waitsForPromise { shouldReject: false, timeout: 5000, label: 'night-night activation' }, ->
      atom.packages.activatePackage('night-light').then () ->
        expect(atom.packages.isPackageActive('night-light')).toBe true
