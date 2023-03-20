
# Folgezettel Renaming Plugin

The Folgezettel renaming plugin allows you easily rename the children files preceded by `[a-zA-Z0-9]+` ids while also keeping filenames such as `1 Medicine Note`. Any file you rename that has an indentifier at the beginning of its filename will rename any markdown children.

Let's say you have the following files:

- 1 Medicine
- 1a Cardiology
- 1b Neurology
- 2 Science
- 3 Engineering

If you rename `1 Medicine` to `4 Medicine` you end up with:

- 2 Science
- 3 Engineering
- 4 Medicine
- 4a Cardiology
- 4b Neurology

