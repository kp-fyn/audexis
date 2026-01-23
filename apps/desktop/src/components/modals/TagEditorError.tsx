import { useTagEditorErrors } from "@/ui/hooks/useTagEditorErrors";
import { Modal } from "./Modal";
import { useState } from "react";

export function TagEditorError() {
  const { isOpen, close, errors } = useTagEditorErrors();
  const [collapsed, setCollapsed] = useState(false);
  console.log(errors);
  return (
    <Modal
      open={isOpen}
      onClose={close}
      title="Tag Editor Error"
      footer={
        <div>
          <a
            href="https://github.com/kp-fyn/audexis"
            className="text-sm text-primary underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Report on Github
          </a>
        </div>
      }
      description="An error occurred while editing tags."
      bodyClassName="p-6"
    >
      {errors.map((errorList, index) => {
        if (index === 0) {
          return (
            <div key={index} className="mb-4">
              {errorList.map((error, idx) => (
                <div key={idx} className="mb-2">
                  <div className="font-medium text-red-600">
                    File: {error.path}
                  </div>
                  <div className="text-sm text-foreground/80">
                    Error: {error.public_message}
                  </div>
                  <div className="text-xs text-foreground/60">
                    Details: {error.internal_message}
                  </div>
                </div>
              ))}
              <button
                className={`text-sm text-primary underline ${
                  collapsed ? "block mt-2" : "hidden"
                }`}
                onClick={() => setCollapsed(false)}
              >
                Collapse
              </button>
            </div>
          );
        } else if (index > 1) {
          return (
            <div key={index}>
              {!collapsed ? (
                <button
                  className="text-sm text-primary underline"
                  onClick={() => setCollapsed(true)}
                >
                  Show {errors.length - 2} more error
                  {errors.length - 2 > 1 ? "s" : ""}
                </button>
              ) : (
                <>
                  {errorList.map((error, idx) => (
                    <div key={idx} className="mb-2">
                      <div className="font-medium text-red-600">
                        File: {error.path}
                      </div>
                      <div className="text-sm text-foreground/80">
                        Error: {error.public_message}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        }
      })}{" "}
    </Modal>
  );
}
