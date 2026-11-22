import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

/** 白屏比报错更糟：至少把错误原因显示出来 */
export class Boundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[deep]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <main className="boot">
          <p className="boot-line">出错了</p>
          <p className="boot-sub">{this.state.error.message}</p>
          <button
            type="button"
            className="boot-retry"
            onClick={() => window.location.reload()}
          >
            重新加载
          </button>
        </main>
      )
    }
    return this.props.children
  }
}
