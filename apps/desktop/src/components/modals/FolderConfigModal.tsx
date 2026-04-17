import { useEffect, useState } from "react";

import { Modal, useAnimatedModalClose } from "./Modal";

interface FolderConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export function FolderConfigModal({ open, onClose }: FolderConfigModalProps) {
  const { closing, requestClose } = useAnimatedModalClose(onClose, 160);

  return (
    <Modal
      open={open}
      onClose={requestClose}
      closing={closing}
      title={`Release notes •`}
      description="What's new in this version"
      bodyClassName="p-0"
    >
      <div className="px-8 md:px-20 py-8 prose prose-slate dark:prose-invert max-w-none">
        s
      </div>
    </Modal>
  );
}

function getBody(source: string): {
  body: string;
} {
  const body = source.replace(/^---\n[\s\S]+?\n---/, "").trim();

  return { body };
}
