import Bun, { $ } from 'bun'

await $`xcrun notarytool history --apple-id ${process.env.APPLEID} --password ${process.env.APPLEIDPASS} --team-id ${process.env.TEAMID}`
