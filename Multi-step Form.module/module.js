function createFormInputManager() {
  return new Promise((resolve, reject) => {
    function findForm() {
      // Adding form ID here since it's possible the window object
      // is available before the form itself has been created
      const formId = window.ipec?.formId;
      return document.querySelector(`form[data-form-id="${formId}"]`);
    }

    function initManager(form) {
      const formControls = form.querySelectorAll(
        'input, select, textarea, button'
      );
      const controlList = [];
      let submitButton = null;

      function findLabel(control) {
        let label = form.querySelector(`label[for="${control.id}"]`);
        if (!label && control.name) {
          label = form.querySelector(`label[for="${control.name}"]`);
        }
        if (!label) {
          label = control.closest('label');
        }
        return label;
      }

      formControls.forEach(control => {
        const label = findLabel(control);
        const controlInfo = {
          element: control,
          label: label,
          name: control.name || 'unnamed',
          type: control.type || control.tagName.toLowerCase(),
          id: control.id || 'no id',
        };

        if (controlInfo.type === 'submit') {
          submitButton = controlInfo;
        } else {
          controlList.push(controlInfo);
        }
      });

      console.log('Form controls found:');
      console.table(
        controlList.map(({ name, type, id }) => ({ name, type, id }))
      );
      if (submitButton) {
        console.log('Submit button found:', submitButton);
      }

      function hideAllControls() {
        controlList.forEach(control => {
          control.element.style.display = 'none';
          if (control.label) {
            control.label.style.display = 'none';
          }
        });
        if (submitButton) {
          submitButton.element.style.display = 'none';
          if (submitButton.label) {
            submitButton.label.style.display = 'none';
          }
        }
      }

      function showControls(startIndex, count) {
        for (
          let i = startIndex;
          i < startIndex + count && i < controlList.length;
          i++
        ) {
          controlList[i].element.style.display = '';
          if (controlList[i].label) {
            controlList[i].label.style.display = '';
          }
        }
      }

      let currentStep = 0;
      let stepArray = [];

      function setStepArray(array) {
        stepArray = array;
        currentStep = 0;
        updateFormView();
        setupInputListeners();
      }

      function updateFormView() {
        hideAllControls();
        let startIndex = 0;
        for (let i = 0; i <= currentStep; i++) {
          showControls(startIndex, stepArray[i]);
          startIndex += stepArray[i];
        }

        // Show submit button if it's the last step
        if (submitButton && currentStep === stepArray.length - 1) {
          submitButton.element.style.display = '';
          if (submitButton.label) {
            submitButton.label.style.display = '';
          }
        }
      }

      function setupInputListeners() {
        controlList.forEach((control, index) => {
          control.element.addEventListener('input', () => {
            const currentStepIndex = getCurrentStepIndex(index);
            if (currentStepIndex === currentStep && hasValueInCurrentStep()) {
              nextStep();
            }
          });
        });
      }

      function getCurrentStepIndex(controlIndex) {
        let sum = 0;
        for (let i = 0; i < stepArray.length; i++) {
          sum += stepArray[i];
          if (controlIndex < sum) {
            return i;
          }
        }
        return stepArray.length - 1;
      }

      function hasValueInCurrentStep() {
        let startIndex = 0;
        for (let i = 0; i < currentStep; i++) {
          startIndex += stepArray[i];
        }
        for (let i = startIndex; i < startIndex + stepArray[currentStep]; i++) {
          if (controlList[i].element.value.trim() !== '') {
            return true;
          }
        }
        return false;
      }

      function nextStep() {
        if (currentStep < stepArray.length - 1) {
          currentStep++;
          updateFormView();
        }
      }

      function previousStep() {
        if (currentStep > 0) {
          currentStep--;
          updateFormView();
        }
      }

      return {
        setStepArray,
        nextStep,
        previousStep,
        getCurrentStep: () => currentStep,
        getTotalSteps: () => stepArray.length,
        hasSubmitButton: () => !!submitButton,
      };
    }

    const observer = new MutationObserver(mutations => {
      for (let mutation of mutations) {
        if (mutation.type === 'childList') {
          const form = findForm();
          if (form) {
            observer.disconnect();
            const manager = initManager(form);
            console.log('Form manager initialized and ready to use.');
            resolve(manager);
            return;
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    console.log(`Waiting for form to be added to the page...`);

    setTimeout(() => {
      observer.disconnect();
      reject(
        new Error(`Form with specified formId not found within 30 seconds.`)
      );
    }, 30000);
  });
}

// Usage
createFormInputManager('test')
  .then(formManager => {
    formManager.setStepArray(window.ipec.steps);

    function updateUI() {
      const currentStep = formManager.getCurrentStep();
      const totalSteps = formManager.getTotalSteps();
    }

    // Initial UI update
    updateUI();
  })
  .catch(error => {
    console.error('Failed to initialize form manager:', error);
  });
