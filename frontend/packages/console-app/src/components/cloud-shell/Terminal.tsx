import * as React from 'react';
import { Terminal as XTerminal, ITerminalOptions, ITerminalAddon } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { useSelector, useDispatch } from 'react-redux';
import { selectAssistantCommand } from '../../redux/reducers/assistant-selectors';
import { setAssistantCommand } from '../../redux/actions/assistant-actions';

import './Terminal.scss';

const terminalOptions: ITerminalOptions = {
  fontFamily: 'monospace',
  fontSize: 16,
  cursorBlink: false,
  cols: 80,
  rows: 25,
};

type TerminalProps = {
  onData: (data: string) => void;
  onResize: (cols: number, rows: number) => void;
};

export type ImperativeTerminalType = {
  focus: () => void;
  reset: () => void;
  onDataReceived: (data) => void;
  onConnectionClosed: (msg: string) => void;
  loadAttachAddon: (addOn: ITerminalAddon) => void;
};

const Terminal = React.forwardRef<ImperativeTerminalType, TerminalProps>(
  ({ onData, onResize }, ref) => {
    const terminal = React.useRef<XTerminal>();
    const terminalRef = React.useRef<HTMLDivElement>();
    const command = useSelector(selectAssistantCommand);
    const dispatch = useDispatch();
    const setCommand = React.useCallback((c: string) => dispatch(setAssistantCommand(c)), [dispatch, setAssistantCommand]);

    React.useEffect(()  => {
      console.log('Terminal useEffect start ------------------------------- command:', command);
      if (!command) return undefined;
      let mounted = true;
      const pasteToTerminal = () => {
        if (!mounted) return;
        if (!terminal.current) {
          window.setTimeout(pasteToTerminal, 500);
          return;
        }
        console.log('copy pasting the command from the assistant to the terminal:', command);
        setCommand('');
        onData(command);
      };
      pasteToTerminal();
      console.log('Terminal useEffect end -------------------------------');
      return () => {
        mounted = false;
      };
    }, [command, onData, setCommand]);

    React.useEffect(() => {
      const term: XTerminal = new XTerminal(terminalOptions);
      const fitAddon = new FitAddon();
      term.open(terminalRef.current);
      term.loadAddon(fitAddon);
      term.focus();

      const resizeObserver: ResizeObserver = new ResizeObserver(() => {
        window.requestAnimationFrame(() => fitAddon.fit());
      });

      resizeObserver.observe(terminalRef.current);

      if (terminal.current !== term) {
        terminal.current && terminal.current.dispose();
        terminal.current = term;
      }

      return () => {
        term.dispose();
        resizeObserver.disconnect();
      };
    }, []);

    const handleResize = React.useCallback(
      ({ cols, rows }: { cols: number; rows: number }) => {
        onResize(cols, rows);
      },
      [onResize],
    );

    React.useEffect(() => {
      const term = terminal.current;
      const data = term.onData(onData);
      const resize = term.onResize(handleResize);
      return () => {
        data.dispose();
        resize.dispose();
      };
    }, [onData, handleResize]);

    React.useImperativeHandle(ref, () => ({
      focus: () => {
        terminal.current && terminal.current.focus();
      },
      reset: () => {
        if (!terminal.current) return;
        terminal.current.reset();
        terminal.current.clear();
        terminal.current.setOption('disableStdin', false);
      },
      onDataReceived: (data) => {
        terminal.current && terminal.current.write(data);
      },
      onConnectionClosed: (msg) => {
        if (!terminal.current) return;
        terminal.current.write(`\x1b[31m${msg || 'disconnected'}\x1b[m\r\n`);
        terminal.current.setOption('disableStdin', true);
      },
      loadAttachAddon: (addOn: ITerminalAddon) => {
        if (!terminal.current) return;
        terminal.current.loadAddon(addOn);
      },
    }));

    return <div className="co-terminal" ref={terminalRef} />;
  },
);

export default Terminal;
