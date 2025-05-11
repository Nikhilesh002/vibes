FROM golang:alpine AS builder

WORKDIR /build

ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64

RUN apk add --no-cache git

COPY go.mod ./
RUN cp go.sum ./ || true

RUN --mount=type=cache,target=/go/pkg/mod go mod download

COPY . .

RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/go-build \
    go build -ldflags="-s -w" -buildvcs=false -o transcoder .



FROM jrottenberg/ffmpeg:snapshot-scratch AS runner

COPY --from=builder /build/transcoder /
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

ENTRYPOINT ["/transcoder"]