import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageDir = join(scriptDir, '..');

function replaceOnce(filePath, from, to) {
  const source = readFileSync(filePath, 'utf8');
  if (!source.includes(from)) {
    if (source.includes(to)) {
      return;
    }
    throw new Error(`Expected generated code was not found in ${filePath}`);
  }

  writeFileSync(filePath, source.replace(from, to));
}

replaceOnce(
  join(packageDir, 'nitrogen/generated/shared/c++/views/HybridMapViewComponent.cpp'),
  `    const std::shared_ptr<const HybridMapViewProps>& constProps = concreteShadowNode.getConcreteSharedProps();
    const std::shared_ptr<HybridMapViewProps>& props = std::const_pointer_cast<HybridMapViewProps>(constProps);
`,
  `    auto constProps = std::static_pointer_cast<const HybridMapViewProps>(concreteShadowNode.getProps());
    auto props = std::const_pointer_cast<HybridMapViewProps>(constProps);
`,
);

replaceOnce(
  join(packageDir, 'nitrogen/generated/shared/c++/views/HybridMapViewComponent.hpp'),
  `  HybridMapViewState(const HybridMapViewState& /* previousState */, folly::dynamic /* data */) {}
`,
  `  HybridMapViewState(const HybridMapViewState& previousState, folly::dynamic /* data */):
    _props(previousState.getProps()) {}
`,
);
