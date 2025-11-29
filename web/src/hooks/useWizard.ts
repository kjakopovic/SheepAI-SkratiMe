import { MutableRefObject, useCallback, useEffect, useMemo, useState } from 'react';

import { has as _has } from 'lodash';

const INITIAL_STEP_INDEX = 0;

const isStepCompleted = <T>(state: T, step: Step<T>) => {
  // if step doesn't have isCompleted defined, it is always completed
  if (!_has(step, 'isCompleted')) {
    return true;
  }

  return step.isCompleted ? step.isCompleted(state) : true;
};

export default <T>(steps: Step<T>[], stepClickEnabled = false, initialState = {} as T): WizardProps<T> => {
  const [stepRef, setStepRef] = useState<MutableRefObject<T>>();
  const [state, setState] = useState<T>(initialState);
  const [isStepClickEnabled] = useState(stepClickEnabled);
  const [activeStepIndex, setActiveStepIndex] = useState(INITIAL_STEP_INDEX);
  const [visitedSteps, setVisitedSteps] = useState(new Set([INITIAL_STEP_INDEX]));
  const [isNextButtonDisabled, setIsNextButtonDisabled] = useState(false);
  const activeStep = useMemo(() => steps[activeStepIndex], [activeStepIndex, steps]);

  const nextStep = useCallback(() => {
    if (activeStepIndex >= steps.length - 1 || (!isStepCompleted(state, activeStep) && !isStepClickEnabled)) {
      return;
    }

    setActiveStepIndex(activeStepIndex + 1);
  }, [activeStep, activeStepIndex, isStepClickEnabled, state, steps]);

  const prevStep = useCallback(() => {
    if (activeStepIndex <= INITIAL_STEP_INDEX) {
      return;
    }

    setActiveStepIndex(activeStepIndex - 1);
  }, [activeStepIndex]);

  const setActiveStep = useCallback(
    (newStep: Step<T>) => {
      const newActiveIndex = steps.findIndex((step) => step === newStep);

      // check if all previous steps are completed
      let prevStepsCompleted = true;
      steps.some((step, index) => {
        if (!isStepCompleted(state, step) && index !== newActiveIndex && !isStepClickEnabled) {
          prevStepsCompleted = false;
        }

        return index === newActiveIndex;
      });

      if (newActiveIndex !== -1 && prevStepsCompleted) {
        setActiveStepIndex(newActiveIndex);
      }
    },
    [isStepClickEnabled, state, steps],
  );

  const setWizardState = useCallback((newState: T) => {
    setState((prevState) => ({ ...prevState, ...newState }));
  }, []);

  const resetWizardState = useCallback((newState: T) => {
    setState((prevState) => ({ ...prevState, ...newState }));
  }, []);

  useEffect(() => {
    if (!visitedSteps.has(activeStep.index)) {
      const newVisited = new Set(visitedSteps);

      newVisited.add(activeStep.index);
      setVisitedSteps(newVisited);
    }
  }, [setVisitedSteps, visitedSteps, activeStep]);

  return {
    activeStep,
    activeStepIndex,
    Component: () =>
      activeStep.Component({
        nextStep,
        prevStep,
        stepRef,
        setStepRef,
        wizardState: state,
        setWizardState,
      }),
    wizardState: state,
    nextStep,
    prevStep,
    resetWizardState,
    setActiveStep,
    setWizardState,
    steps,
    stepRef,
    setStepRef,
    visitedSteps,
    isStepClickEnabled,
    isNextButtonDisabled,
    setIsNextButtonDisabled,
  };
};
