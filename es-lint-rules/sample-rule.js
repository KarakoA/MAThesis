
module.exports = {
create(context) {
    return context.parserServices.defineTemplateBodyVisitor(
        // Event handlers for <template>.
        {
            VElement(node) {
              //console.log("ASDGF")
                console.log(node.type)
                console.log(node.range)
                console.log("DONE")
                context.report({
                    node: node,
                    message: "Unexpected identifier"
                });
                //...
            },
            VText(node) {
              //console.log("ASDGF")
              console.log(node.value)
              console.log(node.loc)
              //  console.log(node.value)
            }
        },
        // Event handlers for <script> or scripts. (optional)
        {
            Program(node) {
                //console.log(node)
                //...
            }
        }
    )
},
}